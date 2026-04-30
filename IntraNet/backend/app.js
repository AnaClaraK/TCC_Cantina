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
    cb(null, "images/");
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
//--------- PRODUTOS Cadastro
app.post("/produtos", verificarToken, uploadProdutos.single("imagem"), async (req, res) => {
  try {
      const { nome, preco, codigo_barras } = req.body;
      const precoFormatado = preco.replace(",", ".");
      const imagem = req.file ? "/images/" + req.file.filename : null;

      await conexao.query("INSERT INTO produtos (nome, preco, codigo_barras, img) VALUES (?, ?, ?, ?)", 
      [nome, precoFormatado, codigo_barras, imagem]);

      res.json({ mensagem: "Produto cadastrado com sucesso" });
  } catch (erro) {
      res.status(500).json({ erro: "Erro ao cadastrar" });
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

        const {
            id_user,
            valor_total,
            qtd_total,
            form_pag,
            itens
        } = req.body;

        const idCliente = id_user || 1;
        const status = "Finalizado";
        const data = new Date();

        const [ultimoPedido] = await conn.query(`
            SELECT MAX(num_pedido) AS ultimoNumero
            FROM pedidos
        `);

        const num_pedido = (ultimoPedido[0].ultimoNumero || 0) + 1;

        const [resultadoPedido] = await conn.query(`
            INSERT INTO pedidos (
                id_user,
                num_pedido,
                data,
                status,
                valor_total,
                qtd_total,
                form_pag
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            idCliente,
            num_pedido,
            data,
            status,
            valor_total,
            qtd_total,
            form_pag
        ]);

        const id_pedido = resultadoPedido.insertId;

        if (itens && itens.length > 0) {
            for (const item of itens) {

                // Primeiro verifica e baixa o estoque
                const [resultadoEstoque] = await conn.query(`
                    UPDATE produtos
                    SET qtd = qtd - ?
                    WHERE id_produto = ?
                      AND qtd >= ?
                `, [
                    item.qtd,
                    item.id_produto,
                    item.qtd
                ]);

                if (resultadoEstoque.affectedRows === 0) {
                    throw new Error(`Estoque insuficiente para o produto ID ${item.id_produto}`);
                }

                // Depois salva o item do pedido
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
                    item.preco_unitario ?? item.preco
                ]);
            }
        }

        await conn.commit();

        res.status(201).json({
            resposta: "Pedido finalizado com sucesso!",
            id_pedido,
            num_pedido,
            status
        });

    } catch (erro) {
        await conn.rollback();

        console.error("Erro ao salvar pedido:", erro);

        res.status(500).json({
            resposta: erro.message || "Erro ao salvar pedido."
        });
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
      SELECT p.*, c.nome AS categoria_nome
      FROM produtos p
      LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
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

// ATUALIZAR DADOS DO PRODUTO (Protegido)
app.put("/produtos/cod/:id", verificarToken, uploadProduto.single("img"), async (req, res) => {
  const { id } = req.params;
  const { nome, codigo_barras, preco, qtd, descricao } = req.body;
  let img = req.file ? req.file.filename : null;

  await conexao.query(`
    UPDATE produtos SET
      nome = ?, codigo_barras = ?, preco = ?, qtd = ?, descricao = ?, img = COALESCE(?, img)
    WHERE id_produto = ?
  `, [nome, codigo_barras, preco, qtd, descricao, img, id]);

  res.json({ msg: "ok" });
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
// Fazer agendamento(ele deve ser feito pelo app, ams é só pra teste)
app.post("/agendamento", verificarToken, async (req, res) => {
    const conn = await conexao.getConnection();

    try {
        await conn.beginTransaction();

        const {
            id_user,
            data,
            valor_total,
            qtd_total,
            form_pag,
            itens
        } = req.body;

        const status = "Agendado";

        const [ultimoPedido] = await conn.query(`
            SELECT MAX(num_pedido) AS ultimoNumero
            FROM pedidos
        `);

        const num_pedido = (ultimoPedido[0].ultimoNumero || 0) + 1;

        const [resultadoPedido] = await conn.query(`
            INSERT INTO pedidos (
                id_user,
                num_pedido,
                data,
                status,
                valor_total,
                qtd_total,
                form_pag
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            id_user,
            num_pedido,
            data,
            status,
            valor_total,
            qtd_total,
            form_pag
        ]);

        const id_pedido = resultadoPedido.insertId;

        if (itens && itens.length > 0) {
            for (const item of itens) {

                // BAIXA ESTOQUE PRIMEIRO
                const [resultadoEstoque] = await conn.query(`
                    UPDATE produtos
                    SET qtd = qtd - ?
                    WHERE id_produto = ?
                      AND qtd >= ?
                `, [
                    item.qtd,
                    item.id_produto,
                    item.qtd
                ]);

                if (resultadoEstoque.affectedRows === 0) {
                    throw new Error(`Estoque insuficiente para o produto ID ${item.id_produto}`);
                }

                // SALVA ITEM
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

        res.status(201).json({
            resposta: "Agendamento criado com sucesso!",
            id_pedido,
            num_pedido
        });

    } catch (erro) {
        await conn.rollback();
        console.error("Erro ao criar agendamento:", erro);

        res.status(500).json({
            resposta: erro.message || "Erro ao criar agendamento."
        });
    } finally {
        conn.release();
    }
});

//--- Listar agendamentos
app.get("/agendamento", verificarToken, async (req, res) => {
    try {
        const [rows] = await conexao.query(`
            SELECT 
                p.id_pedido,
                p.num_pedido,
                p.data,
                p.valor_total,
                p.qtd_total,
                p.form_pag,
                p.status,
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
                    valor_total: r.valor_total,
                    qtd_total: r.qtd_total,
                    form_pag: r.form_pag,
                    status: r.status,
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
//- finalziar agendamento
app.put("/agendamento/:id/finalizar", verificarToken, async (req, res) => {
    try {
        const id = req.params.id;

        const [result] = await conexao.query(`
            UPDATE pedidos
            SET status = 'Finalizado'
            WHERE id_pedido = ?
        `, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ erro: "Agendamento não encontrado" });
        }

        res.json({ mensagem: "Agendamento finalizado com sucesso" });

    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: "Erro ao finalizar agendamento" });
    }
});