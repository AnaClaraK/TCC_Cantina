const express = require('express')
const cors = require('cors')
const crypto = require('crypto')
const multer = require("multer");
const path = require("path");
const conexao = require('./db.js') // Certifique-se que o db.js está na mesma pasta
const fs = require('fs')
const app = express()
const porta = 3000
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const jwt = require('jsonwebtoken');
const SECRET = "C@ntina_Pr0jeto_2025_!#Z0ne_S3cur3"; // Troque por algo difícil

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/fonts', express.static(path.join(__dirname, 'fonts')));

// Middleware: Verifica se o usuário está logado
function verificarToken(req, res, next) {
  const token = req.headers['authorization'];

  if (!token) return res.status(401).json({ "resposta": "Acesso negado. Faça login." });

  // O token geralmente vem como "Bearer TOKEN_AQUI", então limpamos:
  const tokenLimpo = token.split(' ')[1] || token;

  jwt.verify(tokenLimpo, SECRET, (err, decoded) => {
      if (err) return res.status(403).json({ "resposta": "Token inválido ou expirado." });
      
      req.usuarioId = decoded.id; // Salva o ID do funcionário para uso posterior
      next();
  });
}
let ejs = require('ejs');
// Define o EJS como o motor de busca
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // Pasta onde ficarão os arquivos

// Configurações iniciais
app.use(express.json())
app.use(cors())

// Esta linha é a mágica: ela torna a pasta de imagens acessível via URL
app.use('/images', express.static(path.join(__dirname, '../frontend/images')));
app.use('/imagens', express.static(path.join(__dirname, 'imagens')));

app.listen(porta, () => { 
  console.log(`Servidor rodando em: http://localhost:${porta}`)
})

// MULTER PARA PRODUTOS (frontend - comidas)
const storageProdutos = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../frontend/images"));
  },

  filename: function (req, file, cb) {
    const nomeUnico = Date.now() + path.extname(file.originalname);
    cb(null, nomeUnico);
  }
});

const uploadProdutos = multer({ storage: storageProdutos });


// MULTER PARA PERFIL (backend - pessoal)
const storagePerfil = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "imagens/");
  },
  filename: function (req, file, cb) {
    const nomeUnico = Date.now() + path.extname(file.originalname);
    cb(null, nomeUnico);
  }
});

// MULTER PARA Produtos (backend - pessoal)
const uploadPerfil = multer({ storage: storagePerfil });

const storageProduto = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "imagens/"); // mesma pasta do perfil
  },
  filename: function (req, file, cb) {
    const nomeUnico = Date.now() + path.extname(file.originalname);
    cb(null, nomeUnico);
  }
});

const uploadProduto = multer({ storage: storageProduto });
//---------------------------------------------------------------------------------

//-------- Cadastro Funcionários
app.post("/cadastro", uploadPerfil.single("imagem"), async (req, res) => {
  try {
      const { nome, email, senha, confsenha } = req.body;

      const imagem = req.file
          ? "/imagens/" + req.file.filename
          : "/imagens/def_avt.jpg";

      // Validações
      if (!nome || nome.trim() === "") {
          return res.status(400).json({
              resposta: "Preencha o nome."
          });
      }

      if (!email || !email.includes("@") || !email.includes(".")) {
          return res.status(400).json({
              resposta: "E-mail inválido."
          });
      }

      if (!senha || !confsenha) {
          return res.status(400).json({
              resposta: "Preencha a senha e a confirmação."
          });
      }

      if (senha !== confsenha) {
          return res.status(400).json({
              resposta: "As senhas não coincidem."
          });
      }

      if (senha.length < 8) {
          return res.status(400).json({
              resposta: "A senha deve ter pelo menos 8 caracteres."
          });
      }

      if (!/[!@#$%^&*(),.?\":{}|<>]/.test(senha)) {
          return res.status(400).json({
              resposta: "A senha deve conter pelo menos um caractere especial."
          });
      }

      const [usuarios] = await conexao.query(
          "SELECT id_cadastro FROM cadastro WHERE email = ?",
          [email.trim()]
      );

      if (usuarios.length > 0) {
          return res.status(400).json({
              resposta: "Este e-mail já está cadastrado."
          });
      }

      const senhaHashed = crypto
          .createHash("sha256")
          .update(senha.trim())
          .digest("hex");

      const sql = `
          INSERT INTO cadastro (nome, email, senha, img)
          VALUES (?, ?, ?, ?)
      `;

      await conexao.query(sql, [
          nome.trim(),
          email.trim(),
          senhaHashed,
          imagem
      ]);

      return res.status(201).json({
          resposta: "Cadastro realizado com sucesso!"
      });

  } catch (error) {
      console.error("Erro no cadastro:", error);
      return res.status(500).json({
          resposta: "Erro interno do servidor."
      });
  }
});
//-------- Login de Funcionários
app.post("/login", async (req, res) => {
  try {
      const { email, senha } = req.body;
      const senhaHashed = crypto.createHash("sha256").update(senha.trim()).digest("hex");

      const sql = `SELECT id_cadastro, nome, email, senha, img FROM cadastro WHERE email = ?`;
      let [usuarios] = await conexao.query(sql, [email]);

      if (usuarios.length === 0 || usuarios[0].senha !== senhaHashed) {
          return res.status(401).json({ "resposta": "E-mail ou senha inválidos." });
      }

      const usuario = usuarios[0];

      // GERA O TOKEN (Válido por 8 horas)
      const token = jwt.sign({ id: usuario.id_cadastro }, SECRET, { expiresIn: '8h' });

      return res.json({
          "resposta": "Login realizado com sucesso!",
          "token": token, // O frontend deve salvar esse token no localStorage
          "usuario": {
              "nome": usuario.nome,
              "foto": usuario.img,
              "email": usuario.email
          }
      });

  } catch (error) {
      console.error("Erro no login:", error);
      return res.status(500).json({ "resposta": "Erro interno." });
  }
});

//--Recuperar Senha
app.put("/recuperar-senha", async (req, res) => {
  try {
      const { email, novaSenha, confirmarSenha } = req.body;

      if (!email || !novaSenha || !confirmarSenha) {
          return res.status(400).json({
              resposta: "Preencha todos os campos."
          });
      }

      if (!email.includes("@") || !email.includes(".")) {
          return res.status(400).json({
              resposta: "E-mail inválido."
          });
      }

      if (novaSenha.length < 8) {
          return res.status(400).json({
              resposta: "A senha deve ter pelo menos 8 caracteres."
          });
      }

      if (!/[!@#$%^&*(),.?\":{}|<>]/.test(novaSenha)) {
          return res.status(400).json({
              resposta: "A senha deve conter pelo menos um caractere especial."
          });
      }

      if (novaSenha !== confirmarSenha) {
          return res.status(400).json({
              resposta: "As senhas não coincidem."
          });
      }

      const [usuarios] = await conexao.query(
          "SELECT id_cadastro FROM cadastro WHERE email = ?",
          [email.trim()]
      );

      if (usuarios.length === 0) {
          return res.status(404).json({
              resposta: "E-mail não encontrado."
          });
      }

      const senhaHash = crypto
          .createHash("sha256")
          .update(novaSenha.trim())
          .digest("hex");

      await conexao.query(
          "UPDATE cadastro SET senha = ? WHERE email = ?",
          [senhaHash, email.trim()]
      );

      return res.json({
          resposta: "Senha redefinida com sucesso!"
      });

  } catch (error) {
      console.error("Erro ao redefinir senha:", error);
      return res.status(500).json({
          resposta: "Erro interno do servidor."
      });
  }
});

 // ----- Atualizar perfil (Protegido)
app.put("/perfil/atualizar", verificarToken, uploadPerfil.single("imagem"), async (req, res) => {
  try {
      const {
          nome,
          email,
          emailAntigo,
          senha_atual,
          nova_senha,
          conf_senha
      } = req.body;

      if (!nome || nome.trim() === "") {
          return res.status(400).json({
              resposta: "O nome é obrigatório."
          });
      }

      if (!email || !email.includes("@") || !email.includes(".")) {
          return res.status(400).json({
              resposta: "E-mail inválido."
          });
      }

      const [usuarios] = await conexao.query(
          "SELECT senha FROM cadastro WHERE email = ?",
          [emailAntigo]
      );

      if (usuarios.length === 0) {
          return res.status(404).json({
              resposta: "Usuário não encontrado."
          });
      }

      let senhaSql = "";
      let fotoSql = "";
      let params = [nome.trim(), email.trim()];

      if (nova_senha || conf_senha) {
          if (!senha_atual) {
              return res.status(400).json({
                  resposta: "Informe sua senha atual."
              });
          }

          const senhaAtualHash = crypto
              .createHash("sha256")
              .update(senha_atual.trim())
              .digest("hex");

          if (senhaAtualHash !== usuarios[0].senha) {
              return res.status(401).json({
                  resposta: "Senha atual incorreta."
              });
          }

          if (nova_senha !== conf_senha) {
              return res.status(400).json({
                  resposta: "A nova senha e a confirmação não coincidem."
              });
          }

          if (nova_senha.length < 8) {
              return res.status(400).json({
                  resposta: "A nova senha deve ter pelo menos 8 caracteres."
              });
          }

          if (!/[!@#$%^&*(),.?\":{}|<>]/.test(nova_senha)) {
              return res.status(400).json({
                  resposta: "A nova senha deve conter pelo menos um caractere especial."
              });
          }

          const novaSenhaHash = crypto
              .createHash("sha256")
              .update(nova_senha.trim())
              .digest("hex");

          senhaSql = ", senha = ?";
          params.push(novaSenhaHash);
      }

      let novaFotoPath = null;
      if (req.file) {
          novaFotoPath = `/imagens/${req.file.filename}`;
          fotoSql = ", img = ?";
          params.push(novaFotoPath);
      }

      params.push(emailAntigo);

      const sql = `
          UPDATE cadastro
          SET nome = ?, email = ?
          ${senhaSql}
          ${fotoSql}
          WHERE email = ?
      `;

      await conexao.query(sql, params);

      return res.json({
          resposta: "Perfil atualizado com sucesso!",
          novoNome: nome.trim(),
          novoEmail: email.trim(),
          novaFoto: novaFotoPath
      });

  } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      return res.status(500).json({
          resposta: "Erro ao atualizar perfil."
      });
  }
});
//---buscar produto removida daqui
//--------- Cadastro produtos add
app.post("/produtos", verificarToken, uploadProdutos.single("imagem"), async (req, res) => {
    try {
  
        const {
          nome,
          preco,
          codigo,
          quantidade,
          descricao,
          id_categoria
        } = req.body;
  
        if (!nome || !preco || !codigo || !id_categoria) {
          return res.status(400).json({
            erro: "Preencha todos os campos obrigatórios"
          });
        }
  
        const precoFormatado = String(preco).replace(",", ".");
  
        const imagem = req.file
          ? req.file.filename
          : null;
  
        await conexao.query(`
          INSERT INTO produtos
          (
            nome,
            preco,
            codigo_barras,
            qtd,
            descricao,
            img,
            id_categoria
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          nome,
          precoFormatado,
          codigo,
          quantidade || 0,
          descricao || "",
          imagem,
          id_categoria
        ]);
  
        res.status(201).json({
          mensagem: "Produto cadastrado com sucesso"
        });
  
    } catch (erro) {
  
        console.error("Erro ao cadastrar produto:", erro);
  
        res.status(500).json({
          erro: "Erro ao cadastrar produto"
        });
    }
  });
  // LISTAR CATEGORIAS
app.get("/categorias", verificarToken, async (req, res) => {
    try {
  
      const [rows] = await conexao.query(`
        SELECT id_categoria, nome
        FROM categorias
        ORDER BY nome
      `);
  
      res.json(rows);
  
    } catch (erro) {
  
      console.error("Erro ao buscar categorias:", erro);
  
      res.status(500).json({
        erro: "Erro ao buscar categorias"
      });
    }
  });
//-----Busca
app.get("/produtos/busca", verificarToken, async (req, res) => {
    try {
      const q = req.query.q?.trim();
  
      if (!q) {
        return res.json([]);
      }
  
      const termo = `%${q}%`;
  
      const [rows] = await conexao.query(`
        SELECT id_produto, nome, codigo_barras, preco, qtd
        FROM produtos
        WHERE
          LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
            nome,
            'á','a'),'à','a'),'ã','a'),'â','a'),'é','e'),'ê','e'))
          LIKE
          LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
            ?,
            'á','a'),'à','a'),'ã','a'),'â','a'),'é','e'),'ê','e'))
          OR codigo_barras LIKE ?
        ORDER BY nome
        LIMIT 10
      `, [termo, termo]);
  
      res.json(rows);
    } catch (erro) {
      console.error("Erro na busca:", erro);
      res.status(500).json({ erro: "Erro na busca" });
    }
  });

//--- Buscar por Código de Barras específico 
app.get("/produtos/cod/:codigo", verificarToken, async (req, res) => {
  try {
    const codigo = req.params.codigo;
    const [rows] = await conexao.query(
      "SELECT * FROM produtos WHERE codigo_barras = ?",
      [codigo]
    );

    if (rows.length === 0) return res.status(404).json({ erro: "Produto não encontrado" });

    res.json(rows); 
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Erro ao buscar produto" });
  }
});
//--PDV rota pedidos
app.post("/pedidos", verificarToken, async (req, res) => {
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

app.get("/historico-pedidos", verificarToken, async (req, res) => {
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
//-------------------------------- ESTOQUE
app.get("/produtos", verificarToken, async (req, res) => {
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
app.put("/produtos/cod/:codigo/add", verificarToken, async (req, res) => {
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


//--------Atualizar Produtos
// BUSCAR 1 PRODUTO PARA EDITAR (Protegido)
app.get("/produtos/cod/:id", verificarToken, async (req, res) => {
  const { id } = req.params;
  const [rows] = await conexao.query(
    "SELECT * FROM produtos WHERE id_produto = ?",
    [id]
  );
  res.json(rows[0]);
});

// Editar PRODUTO
app.put("/produtos/cod/:id", verificarToken, uploadProduto.single("img"), async (req, res) => {
    try {
      const { id } = req.params;
      // Adicionamos 'qtd_min' aqui na desestruturação do corpo
      const { nome, codigo_barras, preco, qtd, qtd_min, descricao } = req.body; 
      let img = req.file ? req.file.filename : null;
  
      await conexao.query(`
        UPDATE produtos SET
          nome = ?, 
          codigo_barras = ?, 
          preco = ?, 
          qtd = ?, 
          qtd_min = ?, 
          descricao = ?, 
          img = COALESCE(?, img)
        WHERE id_produto = ?
      `, [nome, codigo_barras, preco, qtd, qtd_min || 0, descricao, img, id]);
  
      res.json({ msg: "ok" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ erro: "Erro ao atualizar produto" });
    }
  });
//--Reposição(compra)
// LISTAR PRODUTOS PARA REPOSIÇÃO (Protegido)
app.get("/reposicao/produtos", verificarToken, async (req, res) => {
    try {
        const termo = (req.query.q || "").trim();

        let sql = `
            SELECT 
                id_produto,
                nome,
                codigo_barras,
                qtd,
                preco,
                img
            FROM produtos
        `;

        let params = [];

        if (termo !== "") {
            sql += `
                WHERE nome LIKE ?
                   OR codigo_barras LIKE ?
            `;
            params = [`%${termo}%`, `${termo}%`];
        }

        sql += `
            ORDER BY nome ASC
            LIMIT 10
        `;

        const [produtos] = await conexao.query(sql, params);

        return res.json(produtos);

    } catch (erro) {
        console.error("Erro ao buscar produtos para reposição:", erro);
        return res.status(500).json({
            erro: "Erro ao buscar produtos."
        });
    }
});

// --- ROTA DE REPOSIÇÃO: Atualiza estoque e registra na tabela 'reposicao' ---
app.put("/reposicao/:codigo", verificarToken, async (req, res) => {
    const conn = await conexao.getConnection();

    try {
        await conn.beginTransaction();

        const codigoBarras = req.params.codigo;
        const { quantidade, local, prioridade } = req.body;

        const [produto] = await conn.query(
            "SELECT id_produto, nome FROM produtos WHERE codigo_barras = ?",
            [codigoBarras]
        );

        if (produto.length === 0) {
            await conn.rollback();
            return res.status(404).json({
                erro: "Produto não encontrado."
            });
        }

        const { id_produto, nome } = produto[0];

        await conn.query(`
            INSERT INTO reposicao (
                id_produto,
                produto,
                qtd_prevista,
                qtd_comprada,
                prioridade,
                local,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            id_produto,
            nome,
            quantidade,
            0,
            prioridade,
            local,
            "Pendente"
        ]);

        await conn.commit();

        res.json({
            mensagem: "Reposição adicionada!"
        });

    } catch (erro) {

        await conn.rollback();

        console.error(erro);

        res.status(500).json({
            erro: "Erro ao criar reposição."
        });

    } finally {
        conn.release();
    }
});

//--- get reposição
app.get("/reposicao", verificarToken, async (req, res) => {
    try {

        const [rows] = await conexao.query(`
            SELECT
                r.produto AS nome,
                r.qtd_prevista AS quantidade_prevista,
                r.qtd_comprada AS quantidade_comprada,
                r.prioridade,
                r.local,
                p.codigo_barras AS codigo,
                r.status
            FROM reposicao r
            JOIN produtos p
                ON p.id_produto = r.id_produto
            WHERE r.status = 'Pendente'
            ORDER BY r.id_produto DESC
        `);

        res.json(rows);

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro ao buscar reposição"
        });

    }
});
//------Reposição concluir
app.put("/reposicao/:codigo/concluir", verificarToken, async (req, res) => {

    try {

        const codigo = req.params.codigo;

        const {
            quantidade_comprada,
            local
        } = req.body;

        const [produto] = await conexao.query(
            "SELECT id_produto FROM produtos WHERE codigo_barras = ?",
            [codigo]
        );

        if (produto.length === 0) {
            return res.status(404).json({
                erro: "Produto não encontrado"
            });
        }

        const id_produto = produto[0].id_produto;

        await conexao.query(
            `
            UPDATE produtos
            SET qtd = qtd + ?
            WHERE id_produto = ?
            `,
            [quantidade_comprada, id_produto]
        );

        await conexao.query(
            `
            UPDATE reposicao
            SET
                qtd_comprada = ?,
                local = ?,
                status = 'Concluído'
            WHERE
                id_produto = ?
                AND status = 'Pendente'
            `,
            [
                quantidade_comprada,
                local,
                id_produto
            ]
        );

        res.json({
            mensagem: "Reposição concluída"
        });

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro ao concluir reposição"
        });
    }
});
//----Reposição Cancelar
app.put("/reposicao/:codigo/cancelar", verificarToken, async (req, res) => {

    try {

        const codigo = req.params.codigo;

        const [produto] = await conexao.query(
            "SELECT id_produto FROM produtos WHERE codigo_barras = ?",
            [codigo]
        );

        if (produto.length === 0) {
            return res.status(404).json({
                erro: "Produto não encontrado"
            });
        }

        await conexao.query(`
            UPDATE reposicao
            SET status = 'Cancelado'
            WHERE id_produto = ?
            AND status = 'Pendente'
        `, [produto[0].id_produto]);

        res.json({
            mensagem: "Reposição cancelada"
        });

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro ao cancelar reposição"
        });
    }
});
//-- Limpar lista reposição 
app.put("/reposicao/cancelar/todos", verificarToken, async (req, res) => {

    try {

        await conexao.query(`
            UPDATE reposicao
            SET status = 'Cancelado'
            WHERE status = 'Pendente'
        `);

        res.json({
            mensagem: "Lista cancelada"
        });

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro ao limpar lista"
        });
    }
});
//--- agendamento
app.post("/agendamento", verificarToken, async (req, res) => {
    const conn = await conexao.getConnection();

    try {
        await conn.beginTransaction();

        const {
            id_user,
            data,
            data_ag,
            valor_total,
            qtd_total,
            form_pag,
            itens
        } = req.body;

        const status = "Agendado";

        const [ultimoPedido] = await conn.query(`
            SELECT COALESCE(MAX(num_pedido),0) AS ultimoNumero
            FROM pedidos
        `);

        const num_pedido = ultimoPedido[0].ultimoNumero + 1;

        const [resultadoPedido] = await conn.query(`
            INSERT INTO pedidos (
                id_user,
                num_pedido,
                data,
                data_ag,
                status,
                valor_total,
                qtd_total,
                form_pag
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            id_user,
            num_pedido,
            data,
            data_ag,
            status,
            valor_total,
            qtd_total,
            form_pag
        ]);

        const id_pedido = resultadoPedido.insertId;

        if (itens && itens.length > 0) {
            for (const item of itens) {

                // 🔒 valida estoque disponível (sem baixar)
                const [produto] = await conn.query(
                    "SELECT qtd FROM produtos WHERE id_produto = ?",
                    [item.id_produto]
                );

                const [reservado] = await conn.query(`
                    SELECT COALESCE(SUM(i.qtd),0) AS total
                    FROM pedidos_itens i
                    JOIN pedidos p ON p.id_pedido = i.id_pedido
                    WHERE i.id_produto = ?
                    AND p.status = 'Agendado'
                `, [item.id_produto]);

                const disponivel = produto[0].qtd - reservado[0].total;

                if (item.qtd > disponivel) {
                    throw new Error(`Sem estoque suficiente para agendamento`);
                }

                await conn.query(`
                    INSERT INTO pedidos_itens (
                        id_pedido,
                        id_produto,
                        qtd,
                        preco_unitario
                    ) VALUES (?, ?, ?, ?)
                `, [
                    id_pedido,
                    item.id_produto,
                    item.qtd,
                    item.preco
                ]);
            }
        }

        await conn.commit();

        res.json({
            resposta: "Agendamento criado com sucesso",
            id_pedido,
            num_pedido
        });

    } catch (erro) {
        await conn.rollback();
        res.status(500).json({ erro: erro.message });

    } finally {
        conn.release();
    }
});

//--- agendamento finalizar
app.put("/agendamento/:id/finalizar", verificarToken, async (req, res) => {
    const conn = await conexao.getConnection();

    try {
        await conn.beginTransaction();

        const id = req.params.id;

        // pega itens do pedido
        const [itens] = await conn.query(`
            SELECT id_produto, qtd
            FROM pedidos_itens
            WHERE id_pedido = ?
        `, [id]);

        for (const item of itens) {
            await conn.query(`
                UPDATE produtos
                SET qtd = qtd - ?
                WHERE id_produto = ?
            `, [item.qtd, item.id_produto]);
        }

        await conn.query(`
            UPDATE pedidos
            SET status = 'Finalizado'
            WHERE id_pedido = ?
        `, [id]);

        await conn.commit();

        res.json({ mensagem: "Agendamento finalizado e estoque baixado" });

    } catch (erro) {
        await conn.rollback();
        res.status(500).json({ erro: "Erro ao finalizar agendamento" });
    } finally {
        conn.release();
    }
});
//-- cancelar agendamento
app.put("/agendamento/:id/cancelar", verificarToken, async (req, res) => {
    try {
        const id = req.params.id;

        const [result] = await conexao.query(`
            UPDATE pedidos
            SET status = 'Cancelado'
            WHERE id_pedido = ?
        `, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                erro: "Agendamento não encontrado"
            });
        }

        res.json({
            mensagem: "Agendamento cancelado com sucesso"
        });

    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: "Erro ao cancelar agendamento"
        });
    }
});

//---
//--- Listar agendamentos
app.get("/agendamento", verificarToken, async (req, res) => {
    try {
        const [rows] = await conexao.query(`
            SELECT 
                p.id_pedido,
                p.num_pedido,
                p.data,
                p.data_ag,
                p.valor_total,
                p.qtd_total,
                p.form_pag,
                p.status,
                p.origem
                u.nome AS cliente_nome,
                i.id_produto,
                pr.nome AS produto_nome,
                i.qtd,
                i.preco_unitario
            FROM pedidos p
            LEFT JOIN users u ON p.id_user = u.id_user
            LEFT JOIN pedidos_itens i ON p.id_pedido = i.id_pedido
            LEFT JOIN produtos pr ON i.id_produto = pr.id_produto
            WHERE p.status = 'Agendado'
            ORDER BY p.data DESC
        `);

        const pedidosMap = {};

        rows.forEach(r => {
            if (!pedidosMap[r.id_pedido]) {
                pedidosMap[r.id_pedido] = {
                    id_pedido: r.id_pedido,
                    num_pedido: r.num_pedido,
                    data: r.data,
                    data_ag: r.data_ag,
                    valor_total: r.valor_total,
                    qtd_total: r.qtd_total,
                    form_pag: r.form_pag,
                    status: r.status,
                    origem: r.origem,
                    cliente_nome: r.cliente_nome,
                    produtos: []
                };
            }

            if (r.id_produto) {
                pedidosMap[r.id_pedido].produtos.push({
                    id_produto: r.id_produto,
                    nome: r.produto_nome,
                    qtd: r.qtd,
                    preco: r.preco_unitario
                });
            }
        });

        res.json(Object.values(pedidosMap));

    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: "Erro ao buscar agendamentos" });
    }
});

//----------------------Clientes Fiado (Conta)
//----Cadastrar
app.post("/clientes-fiado", async (req, res) => {

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
app.get("/clientes-fiado", async (req, res) => {

    const [dados] = await conexao.query(`
        SELECT * FROM clientes_fiado
        ORDER BY nome_completo
    `);

    res.json(dados);
});
//---- Contas Fiado
//-----Cadastrar
app.post("/contas-fiado", async (req, res) => {

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
app.get("/contas-fiado", async (req, res) => {

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
app.put("/contas-fiado/:id/pagar", async (req, res) => {

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