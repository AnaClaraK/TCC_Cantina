
const express =
require('express');

const router =
express.Router();

const conexao =
require('../db');


const verificarToken =
require('../middlewares/auth');
const SECRET = "C@ntina_Pr0jeto_2025_!#Z0ne_S3cur3";
//--PDV rota pedidos
router.post("/pedidos", verificarToken, async (req, res) => {
    const conn = await conexao.getConnection();
    try {
        await conn.beginTransaction();

        const { id_user, valor_total, qtd_total, form_pag, origem, itens } = req.body;
        const idCliente = id_user || 1;
        const status = "Finalizado";
        const data = new Date();
        const alertas = []; // Array para armazenar os avisos de estoque baixo

        const [ultimoPedido] = await conn.query(`SELECT MAX(num_pedido) AS ultimoNumero FROM pedidos`);
        const num_pedido = (ultimoPedido[0].ultimoNumero || 0) + 1;

        const [resultadoPedido] = await conn.query(`
            INSERT INTO pedidos (id_user, num_pedido, data, status, origem, valor_total, qtd_total, form_pag) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [idCliente, num_pedido, data, status, origem, valor_total, qtd_total, form_pag]);

        const id_pedido = resultadoPedido.insertId;

        if (itens && itens.length > 0) {
            for (const item of itens) {
                // BUSCA ESTOQUE ATUAL E QTD MÍNIMA
                const [estoque] = await conn.query(
                    "SELECT nome, qtd, qtd_min FROM produtos WHERE id_produto = ?", 
                    [item.id_produto]
                );

                const produtoDB = estoque[0];
                const novaQtd = produtoDB.qtd - item.qtd;

                // 1. Bloqueio de segurança (Não deixa vender o que não tem)
                if (novaQtd < 0) {
                    throw new Error(`Estoque insuficiente para: ${produtoDB.nome}`);
                }

                // 2. VERIFICAÇÃO DE ESTOQUE MÍNIMO (O AVISO)
                if (novaQtd <= produtoDB.qtd_min) {
                    alertas.push(`O produto "${produtoDB.nome}" atingiu o estoque mínimo (${novaQtd} restantes).`);
                }

                // Atualiza o estoque no banco
                await conn.query("UPDATE produtos SET qtd = ? WHERE id_produto = ?", [novaQtd, item.id_produto]);

                // Salva o item do pedido
                await conn.query(`
                    INSERT INTO pedidos_itens (id_pedido, id_produto, qtd, preco_unitario, origem) 
                    VALUES (?, ?, ?, ?, ?)
                `, [id_pedido, item.id_produto, item.qtd, item.origem, item.preco_unitario ?? item.preco]);
            }
        }

        await conn.commit();

        res.status(201).json({
            resposta: "Pedido finalizado com sucesso!",
            id_pedido,
            num_pedido,
            alertas: alertas // Envia a lista de avisos para o frontend
        });

    } catch (erro) {
        await conn.rollback();
        console.error("Erro ao salvar pedido:", erro);
        res.status(500).json({ resposta: erro.message || "Erro ao salvar pedido." });
    } finally {
        conn.release();
    }
});
//---- Histórico Pedidos

router.get("/historico-pedidos", verificarToken, async (req, res) => {
    try {
        const [pedidos] = await conexao.query(`
            SELECT
                p.id_pedido,
                p.num_pedido,
                p.data,
                p.valor_total,
                p.form_pag,
                p.status,
                p.origem,
                u.nome
            FROM pedidos p
            LEFT JOIN users u ON p.id_user = u.id_user
            WHERE p.status = 'Finalizado'
            ORDER BY p.data DESC
        `);

        res.json(pedidos);
    } catch (erro) {
        console.error("Erro ao buscar histórico:", erro);
        res.status(500).json({
            erro: "Erro ao buscar histórico de pedidos"
        });
    }
});

// ==================== ROTA DE COMANDAS CORRIGIDA ====================
router.post("/comandas", async (req, res) => {
    const { id_user, carrinho, valor_total, qtd_total, status, form_pag } = req.body;

    // 1. Validação básica de segurança
    if (!id_user || !carrinho || carrinho.length === 0) {
        return res.status(400).json({ sucesso: false, erro: "Dados incompletos ou carrinho vazio." });
    }

    try {
        // Gera um número sequencial simples para o num_pedido (ou use o próprio ID do pedido)
        const [ultimoPedido] = await conexao.execute("SELECT MAX(num_pedido) as max_num FROM pedidos");
        const proximoNumero = (ultimoPedido[0].max_num || 0) + 1;

        // 2. Primeiro INSERT: Criar o registro na tabela principal 'pedidos'
        const queryPedido = `
            INSERT INTO pedidos (id_user, num_pedido, data, status, origem, valor_total, qtd_total, form_pag) 
            VALUES (?, ?, NOW(), ?, 'App', ?, ?, ?)
        `;
        
        const [resultadoPedido] = await conexao.execute(queryPedido, [
            id_user,
            proximoNumero,
            status || 'Agendado',
            valor_total,
            qtd_total,
            form_pag || 'PIX (F6)'
        ]);

        // Captura o id_pedido gerado automaticamente pelo AUTO_INCREMENT
        const idPedidoGerado = resultadoPedido.insertId;

        // 3. Segundo INSERT: Salvar cada item dentro da tabela 'pedidos_itens'
        const queryItem = `
            INSERT INTO pedidos_itens (id_pedido, id_produto, qtd, preco_unitario) 
            VALUES (?, ?, ?, ?)
        `;

        // Percorre o array de itens enviados pelo React Native
        for (const item of carrinho) {
            await conexao.execute(queryItem, [
                idPedidoGerado,
                item.id_produto || item.id, // Adapte conforme a propriedade do seu objeto
                item.qtd,
                item.preco_unitario || item.preco
            ]);
        }

        // 4. Resposta de SUCESSO pura em JSON (evita o erro do caractere '<')
        return res.json({
            sucesso: true,
            mensagem: "Pedido gravado com sucesso!",
            id_pedido: idPedidoGerado,
            num_pedido: proximoNumero
        });

    } catch (error) {
        console.error("Erro crítico ao salvar pedido:", error);
        // Retorna sempre um objeto JSON mesmo em caso de erro fatal
        return res.status(500).json({ 
            sucesso: false, 
            erro: "Erro interno no servidor ao processar o banco de dados." 
        });
    }
});
router.get('/comandas/:codigo', async (req, res) => {
    try {
        const { codigo } = req.params;
  
        const queryPedido = `SELECT * FROM pedidos WHERE codigo_comanda = ? AND status = 'pendente'`;
        // Ajustado de db.query para conexao.query
        const [pedidos] = await conexao.query(queryPedido, [codigo]);
  
        if (pedidos.length === 0) {
            return res.status(404).json({ erro: "Comanda não encontrada ou já paga" });
        }
  
        const pedido = pedidos[0];
  
        const queryItens = `
            SELECT pi.*, p.nome 
            FROM pedidos_itens pi
            JOIN produtos p ON pi.id_produto = p.id_produto
            WHERE pi.id_pedido = ?
        `;
        const [itens] = await conexao.query(queryItens, [pedido.id_pedido]);
  
        pedido.carrinho = itens;
        res.json(pedido);
  
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: "Erro ao buscar dados da comanda" });
    }
});
router.get("/historico-pedidos", async (req, res) => {
    try {
        // Coleta os pedidos trazendo o id_user de forma explícita para o app saber de quem é
        const query = `
            SELECT 
                p.id_pedido,
                p.num_pedido,
                p.id_user,
                p.data,
                p.status,
                p.origem,
                p.valor_total,
                p.form_pag,
                u.nome
            FROM pedidos p
            INNER JOIN users u ON p.id_user = u.id_user
            ORDER BY p.data DESC
        `;

        const [resultados] = await conexao.execute(query);
        
        // Garante o retorno puro do array JSON
        return res.json(resultados);

    } catch (error) {
        console.error("Erro ao buscar histórico:", error);
        return res.status(500).json({ erro: "Erro ao processar consulta no banco." });
    }
});""
module.exports = router;