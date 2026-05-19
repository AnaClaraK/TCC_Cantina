
const express =
require('express');

const router =
express.Router();

const conexao =
require('../db');

const verificarToken =
require('../middlewares/auth');
//-------------------------------- ESTOQUE
router.get("/produtos", verificarToken, async (req, res) => {
    try {
      const [rows] = await conexao.query(`
        SELECT 
      p.*,
      c.nome AS categoria_nome,
  
      COALESCE(SUM(
          CASE 
              WHEN pe.status = 'Agendado' THEN pi.qtd
              ELSE 0
          END
      ), 0) AS reservado,
  
      (
          p.qtd - COALESCE(SUM(
              CASE 
                  WHEN pe.status = 'Agendado' THEN pi.qtd
                  ELSE 0
              END
          ), 0)
      ) AS disponivel
  
  FROM produtos p
  
  LEFT JOIN categorias c 
      ON p.id_categoria = c.id_categoria
  
  LEFT JOIN pedidos_itens pi 
      ON pi.id_produto = p.id_produto
  
  LEFT JOIN pedidos pe 
      ON pe.id_pedido = pi.id_pedido
  
  GROUP BY p.id_produto
      `);
  
      res.json(rows);
    } catch (erro) {
      res.status(500).json({ erro: "Erro ao buscar produtos" });
    }
  });
  
// ADD estoque
router.put("/produtos/cod/:codigo/add", verificarToken, async (req, res) => {
    try {
      const codigo = req.params.codigo;
      const { quantidade } = req.body;
  
      if (!quantidade || quantidade <= 0) {
        return res.status(400).json({ erro: "Quantidade inválida" });
      }
  
      const [rows] = await conexao.query(
        "SELECT * FROM produtos WHERE codigo_barras = ?",
        [codigo]
      );
  
      if (rows.length === 0) {
        return res.status(404).json({ erro: "Produto não encontrado" });
      }
  
      await conexao.query(
        "UPDATE produtos SET qtd = COALESCE(qtd, 0) + ? WHERE codigo_barras = ?",
        [quantidade, codigo]
      );
  
      res.json({ mensagem: "Estoque atualizado" });
  
    } catch (erro) {
      res.status(500).json({ erro: "Erro ao atualizar estoque" });
    }
  });
  module.exports = router;