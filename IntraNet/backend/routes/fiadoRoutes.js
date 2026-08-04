const express = require('express');
const router = express.Router();
const conexao = require('../db');

//---------------------------------------------------------
// 👥 GERENCIAMENTO DE CLIENTES FIADO
//---------------------------------------------------------
router.post("/clientes-fiado", async (req, res) => {
    try {
        const { nome_completo, cpf, telefone, endereco } = req.body;
        await conexao.query(`
            INSERT INTO clientes_fiado (nome_completo, cpf, telefone, endereco)
            VALUES (?, ?, ?, ?)
        `, [nome_completo, cpf, telefone, endereco]);
        res.json({ sucesso: true });
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

router.get("/clientes-fiado", async (req, res) => {
    try {
        const [dados] = await conexao.query(`SELECT * FROM clientes_fiado ORDER BY nome_completo`);
        res.json(dados);
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

//---------------------------------------------------------
// 💰 SISTEMA DE FIADO UNIFICADO DENTRO DE PEDIDOS
//---------------------------------------------------------

// ----- Salvar nova compra direto em Pedidos
router.post("/contas-fiado", async (req, res) => {
    const { id_cliente, valor, vencimento, produtos } = req.body;
    const conn = await conexao.getConnection();

    try {
        await conn.beginTransaction();

        const [ultimoPedido] = await conn.query(`SELECT COALESCE(MAX(num_pedido), 0) AS ultimo FROM pedidos`);
        const num_pedido = ultimoPedido[0].ultimo + 1;
        const qtd_total = produtos.reduce((acc, p) => acc + Number(p.qtdSelecionada), 0);

        // Ao criar a dívida, a form_pag inicial entra obrigatoriamente como 'Fiado'
        const [resultadoPedido] = await conn.query(`
            INSERT INTO pedidos (
                id_user, id_cliente_fiado, num_pedido, data, status, 
                valor_total, valor_com_juros, data_vencimento, juros_aplicado, 
                qtd_total, origem, form_pag
            ) VALUES (NULL, ?, ?, NOW(), 'Pendente', ?, ?, ?, FALSE, ?, 'Fiado', 'Fiado')
        `, [id_cliente, num_pedido, valor, valor, vencimento, qtd_total]);

        const idPedido = resultadoPedido.insertId;

        for (const produto of produtos) {
            const [dadosProduto] = await conn.query(`SELECT nome, qtd, preco FROM produtos WHERE id_produto = ?`, [produto.id_produto]);
            if (dadosProduto.length <= 0) throw new Error("Produto não encontrado");

            const estoque = Number(dadosProduto[0].qtd);
            const precoBanco = Number(dadosProduto[0].preco);

            if (produto.qtdSelecionada > estoque) throw new Error(`Estoque insuficiente para ${dadosProduto[0].nome}`);

            await conn.query(`
                INSERT INTO pedidos_itens (id_pedido, id_produto, qtd, preco_unitario)
                VALUES (?, ?, ?, ?)
            `, [idPedido, produto.id_produto, produto.qtdSelecionada, precoBanco]);

            await conn.query(`UPDATE produtos SET qtd = qtd - ? WHERE id_produto = ?`, [produto.qtdSelecionada, produto.id_produto]);
        }

        await conn.commit();
        res.json({ ok: true, id_pedido: idPedido });
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ erro: err.message });
    } finally {
        conn.release();
    }
});


// ------ Listar todas as contas buscando direto da tabela de Pedidos
router.get("/contas-fiado", async (req, res) => {
    try {
        // Rotina de Juros automáticos para itens vencidos
        await conexao.query(`
            UPDATE pedidos
            SET valor_com_juros = valor_total * 1.10,
                juros_aplicado = TRUE,
                status = 'Atrasado'
            WHERE CURDATE() > data_vencimento
              AND origem = 'Fiado'
              AND status = 'Pendente'
              AND juros_aplicado = FALSE
        `);

        // Busca os dados (Filtrando para não trazer os que já foram quitados/Finalizados)
        const [dados] = await conexao.query(`
            SELECT
                p.id_pedido,
                cl.nome_completo,
                p.valor_total AS valor_original,
                COALESCE(p.valor_com_juros, p.valor_total) AS valor_final,
                p.data_vencimento,
                p.status,
                p.origem,
                GROUP_CONCAT(pr.nome SEPARATOR ', ') AS produtos,
                SUM(pi.qtd) AS quantidade_total
            FROM pedidos p
            JOIN clientes_fiado cl ON cl.id_cliente = p.id_cliente_fiado
            LEFT JOIN pedidos_itens pi ON pi.id_pedido = p.id_pedido
            LEFT JOIN produtos pr ON pr.id_produto = pi.id_produto
            WHERE p.origem = 'Fiado' AND p.status != 'Finalizado'
            GROUP BY p.id_pedido
            ORDER BY p.data_vencimento ASC
        `);

        res.json(dados);
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

// ------ Concluir Pagamento
router.put("/contas-fiado/:id/pagar", async (req, res) => {
    const { id } = req.params;
    const { form_pag } = req.body; // Captura o método real enviado do modal de conclusão
    
    try {
        await conexao.query(`
            UPDATE pedidos 
            SET status = 'Finalizado', 
                data_pag = NOW(),
                form_pag = ? 
            WHERE id_pedido = ?
        `, [form_pag, id]);
        
        res.json({ sucesso: true });
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

module.exports = router;