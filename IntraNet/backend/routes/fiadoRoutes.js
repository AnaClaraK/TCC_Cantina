
const express =
require('express');

const router =
express.Router();

const conexao =
require('../db');

const verificarToken =
require('../middlewares/auth');
//----------------------Clientes Fiado (Conta)
//----Cadastrar
router.post("/clientes-fiado", async (req, res) => {

    try{

        const {
            nome_completo,
            cpf,
            telefone,
            endereco
        } = req.body;

        await conexao.query(`
            INSERT INTO clientes_fiado
            (
                nome_completo,
                cpf,
                telefone,
                endereco
            )
            VALUES (?, ?, ?, ?)
        `, [
            nome_completo,
            cpf,
            telefone,
            endereco
        ]);

        res.json({
            sucesso: true
        });

    }catch(err){

        console.log(err);

        res.status(500).json({
            erro: err.message
        });
    }
});
//---Listar
router.get("/clientes-fiado", async (req, res) => {

    const [dados] = await conexao.query(`
        SELECT * FROM clientes_fiado
        ORDER BY nome_completo
    `);

    res.json(dados);
});
//---- Contas Fiado
//-----Cadastrar
router.post("/contas-fiado", async (req, res) => {

    const {
        id_cliente,
        valor,
        vencimento,
        produtos,
        origem
    } = req.body;

    const conn = await conexao.getConnection();

    try{

        await conn.beginTransaction();

        const [conta] = await conn.query(`
            INSERT INTO contas_fiado
            (
                id_cliente,
                valor_original,
                valor_final,
                data_vencimento,
                origem,
                status,
                juros_aplicado
            )
            VALUES (?, ?, ?, ?, ?, 'Pendente', FALSE)
        `, [
            id_cliente,
            valor,
            valor,
            vencimento,
            origem
        ]);

        const idConta = conta.insertId;

        for(const produto of produtos){

            const [dadosProduto] = await conn.query(`
                SELECT
                    qtd,
                    preco
                FROM produtos
                WHERE id_produto = ?
            `, [produto.id_produto]);

            if(dadosProduto.length <= 0){

                throw new Error("Produto não encontrado");
            }

            const estoque =
            Number(dadosProduto[0].qtd);

            const precoBanco =
            Number(dadosProduto[0].preco);

            if(produto.qtdSelecionada > estoque){

                throw new Error(
                    `Estoque insuficiente para ${produto.nome}`
                );
            }

            await conn.query(`
                INSERT INTO conta_fiado_prod
                (
                    id_conta,
                    id_produto,
                    qtd,
                    valor_unit
                )
                VALUES (?, ?, ?, ?)
            `, [
                idConta,
                produto.id_produto,
                produto.qtdSelecionada,
                precoBanco
            ]);

            await conn.query(`
                UPDATE produtos
                SET qtd = qtd - ?
                WHERE id_produto = ?
            `, [
                produto.qtdSelecionada,
                produto.id_produto
            ]);
        }

        await conn.commit();

        res.json({
            ok: true
        });

    }catch(err){

        await conn.rollback();

        console.log(err);

        res.status(500).json({
            erro: err.message
        });

    }finally{

        conn.release();
    }
});
//------ Listar
router.get("/contas-fiado", async (req, res) => {

    await conexao.query(`
        UPDATE contas_fiado
        SET
            valor_final = valor_original * 1.10,
            juros_aplicado = TRUE,
            status = 'Atrasado'
        WHERE
            CURDATE() > data_vencimento
            AND status = 'Pendente'
            AND juros_aplicado = FALSE
    `);

    const [dados] = await conexao.query(`
        SELECT
            c.id_conta,
            cl.nome_completo,
    
            c.valor_original,
            c.valor_final,
    
            c.data_vencimento,
            c.status,
            c.origem,
    
            GROUP_CONCAT(p.nome SEPARATOR ', ') AS produtos,
    
            SUM(cf.qtd) AS quantidade_total
    
        FROM contas_fiado c
    
        JOIN clientes_fiado cl
        ON cl.id_cliente = c.id_cliente
    
        LEFT JOIN conta_fiado_prod cf
        ON cf.id_conta = c.id_conta
    
        LEFT JOIN produtos p
        ON p.id_produto = cf.id_produto
    
        GROUP BY c.id_conta
    
        ORDER BY c.data_vencimento ASC
    `);

    res.json(dados);
});
//------Concluir pagamento
router.put("/contas-fiado/:id/pagar", async (req, res) => {

    const { id } = req.params;

    const { data_pagamento } = req.body;

    await conexao.query(`
        UPDATE contas_fiado
        SET
            status = 'Pago',
            data_pagamento = ?
        WHERE id_conta = ?
    `, [
        data_pagamento,
        id
    ]);

    res.json({
        sucesso: true
    });
});
module.exports = router;