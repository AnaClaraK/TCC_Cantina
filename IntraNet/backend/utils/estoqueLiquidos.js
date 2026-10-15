const fs = require('fs');
const path = require('path');
const conexaoPadrao = require('../db');

// A configuração fica em JSON no backend, não no banco de dados.
// Assim, a tabela produtos permanece intacta: qtd/qtd_min são ml apenas
// para os produtos listados nos grupos abaixo.
const ARQUIVO_CONFIG = path.join(__dirname, 'estoqueLiquidosConfig.json');
let filaGravacao = Promise.resolve();

async function lerConfiguracao() {
    try {
        const texto = await fs.promises.readFile(ARQUIVO_CONFIG, 'utf8');
        const dados = JSON.parse(texto);
        return { grupos: Array.isArray(dados.grupos) ? dados.grupos : [] };
    } catch (erro) {
        if (erro.code === 'ENOENT') return { grupos: [] };
        throw new Error(`Não foi possível ler a configuração de estoque líquido: ${erro.message}`);
    }
}

async function gravarConfiguracao(config) {
    filaGravacao = filaGravacao.then(async () => {
        const temporario = `${ARQUIVO_CONFIG}.tmp`;
        await fs.promises.writeFile(temporario, JSON.stringify(config, null, 2), 'utf8');
        await fs.promises.rename(temporario, ARQUIVO_CONFIG);
    });
    await filaGravacao;
}

function obterVolumeVendaMl(nome) {
    const texto = String(nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const match = texto.match(/(?:^|\s)(\d+(?:[.,]\d+)?)\s*ml(?:\b|$)/i);
    if (!match) return 0;
    const volume = Number(match[1].replace(',', '.'));
    return Number.isFinite(volume) && volume > 0 ? volume : 0;
}

function acharGrupo(config, idProduto) {
    const id = Number(idProduto);
    return config.grupos.find(g => Array.isArray(g.ids) && g.ids.map(Number).includes(id)) || null;
}

async function obterGrupoLiquido(idProduto) {
    const config = await lerConfiguracao();
    const grupo = acharGrupo(config, idProduto);
    return grupo ? { ...grupo, ids: grupo.ids.map(Number) } : null;
}

async function configurarGrupoLiquido(idsProdutos) {
    const ids = [...new Set((idsProdutos || []).map(Number).filter(id => Number.isInteger(id) && id > 0))];
    if (!ids.length) throw new Error('Selecione pelo menos um produto.');
    const config = await lerConfiguracao();
    // Produtos selecionados deixam seus grupos anteriores; os outros membros
    // continuam juntos, desde que ainda haja pelo menos um integrante.
    const gruposRestantes = [];
    for (const grupo of config.grupos) {
        const restantes = (grupo.ids || []).map(Number).filter(id => !ids.includes(id));
        if (restantes.length) gruposRestantes.push({ ...grupo, ids: restantes });
    }
    const novoGrupo = { id: `ml_${Date.now()}_${ids[0]}`, ids };
    gruposRestantes.push(novoGrupo);
    await gravarConfiguracao({ grupos: gruposRestantes });
    return novoGrupo;
}

async function aplicarDisponibilidadeReceitas(produtos, conn = conexaoPadrao, options = {}) {
    if (!Array.isArray(produtos) || !produtos.length) return produtos;
    const config = await lerConfiguracao();
    const ids = [...new Set(config.grupos.flatMap(g => (g.ids || []).map(Number)))];
    if (!ids.length) return produtos;

    const [saldos] = await conn.query('SELECT id_produto, qtd, qtd_min FROM produtos WHERE id_produto IN (?)', [ids]);
    const saldoPorId = new Map(saldos.map(p => [Number(p.id_produto), p]));
    for (const produto of produtos) {
        const grupo = acharGrupo(config, produto.id_produto);
        if (!grupo) continue;
        const membros = (grupo.ids || []).map(Number);
        const base = saldoPorId.get(membros[0]) || saldoPorId.get(Number(produto.id_produto));
        if (!base) continue;
        const ml = Math.max(0, Number(base.qtd || 0));
        const minimoMl = Math.max(0, Number(base.qtd_min ?? 100));
        const volume = obterVolumeVendaMl(produto.nome);
        produto.estoque_em_ml = 1;
        produto.estoque_compartilhado = true;
        produto.quantidade_ml = ml;
        produto.qtd_min_ml = minimoMl;
        produto.qtd_base_produto = ml;
        produto.qtd_venda_disponivel = volume ? Math.floor((ml + 1e-9) / volume) : 0;
        if (options.mostrarVolume) {
            produto.qtd = ml;
            produto.qtd_min = minimoMl;
            produto.disponivel = ml;
        } else {
            produto.qtd = produto.qtd_venda_disponivel;
            produto.qtd_min = volume ? Math.ceil(minimoMl / volume) : 0;
            produto.estoque_por_volume = 1;
        }
    }
    return produtos;
}

async function consumirEstoqueProduto(conn, idProduto, quantidade, nomeFallback = 'produto') {
    const qtdVenda = Number(quantidade);
    if (!Number.isInteger(qtdVenda) || qtdVenda <= 0) throw new Error(`Quantidade inválida para ${nomeFallback}.`);
    // Consulta sem bloqueio primeiro para descobrir se o produto pertence
    // a um grupo. Para grupos, os saldos são bloqueados em ordem de ID.
    const [consulta] = await conn.query(
        'SELECT id_produto, nome, qtd, qtd_min, ativo FROM produtos WHERE id_produto = ?',
        [idProduto]
    );
    if (!consulta.length) throw new Error(`Produto não encontrado: ${nomeFallback}.`);
    const grupo = await obterGrupoLiquido(idProduto);
    if (grupo) {
        const produto = consulta[0];
        if (Number(produto.ativo) !== 1) throw new Error(`O produto "${produto.nome}" está inativo e não pode ser vendido.`);
        const volumeMl = obterVolumeVendaMl(produto.nome);
        if (!volumeMl) throw new Error(`O produto "${produto.nome}" está configurado em ml, mas o nome precisa informar o volume vendido (ex.: 50 ml ou 100 ml).`);
        const membros = [...new Set(grupo.ids.map(Number))].sort((a, b) => a - b);
        const [saldos] = await conn.query(
            'SELECT id_produto, nome, qtd, qtd_min FROM produtos WHERE id_produto IN (?) ORDER BY id_produto FOR UPDATE',
            [membros]
        );
        if (saldos.length !== membros.length) throw new Error('Um dos produtos do estoque compartilhado não foi encontrado.');
        const saldoMl = Math.max(0, Number(saldos[0].qtd || 0));
        const consumoMl = volumeMl * qtdVenda;
        if (consumoMl > saldoMl + 1e-9) {
            const unidades = Math.floor((saldoMl + 1e-9) / volumeMl);
            throw new Error(`Estoque insuficiente para ${produto.nome}: restam ${saldoMl} ml, suficientes para ${unidades} unidade(s).`);
        }
        const novoSaldoMl = Math.max(0, saldoMl - consumoMl);
        await conn.query('UPDATE produtos SET qtd = ? WHERE id_produto IN (?)', [novoSaldoMl, membros]);
        const minimoMl = Math.max(0, Number(saldos[0].qtd_min ?? 100));
        return { nome: produto.nome, qtdRestante: novoSaldoMl, qtdMin: minimoMl, quantidadeMlRestante: novoSaldoMl, mapeado: true, volume: true, volumeVendaMl: volumeMl };
    }

    const [normaisBloqueados] = await conn.query(
        'SELECT id_produto, nome, qtd, qtd_min, ativo FROM produtos WHERE id_produto = ? FOR UPDATE',
        [idProduto]
    );
    const produtoNormal = normaisBloqueados[0];
    if (!produtoNormal) throw new Error(`Produto não encontrado: ${nomeFallback}.`);
    if (Number(produtoNormal.ativo) !== 1) throw new Error(`O produto "${produtoNormal.nome}" está inativo e não pode ser vendido.`);
    const saldo = Number(produtoNormal.qtd || 0);
    const novoSaldo = saldo - qtdVenda;
    if (novoSaldo < 0) throw new Error(`Estoque insuficiente para: ${produtoNormal.nome}.`);
    await conn.query('UPDATE produtos SET qtd = ? WHERE id_produto = ?', [novoSaldo, idProduto]);
    return { nome: produtoNormal.nome, qtdRestante: novoSaldo, qtdMin: Number(produtoNormal.qtd_min || 0), mapeado: false, volume: false };
}

// Mantido apenas para compatibilidade com rotas antigas. Não executa DDL.
async function garantirTabelasLiquidos() { return true; }

module.exports = {
    garantirTabelasLiquidos,
    aplicarDisponibilidadeReceitas,
    consumirEstoqueProduto,
    obterVolumeVendaMl,
    obterGrupoLiquido,
    configurarGrupoLiquido
};
