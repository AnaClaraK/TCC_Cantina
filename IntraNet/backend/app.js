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
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

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

//--------Funcionários
app.post("/cadastro", uploadPerfil.single("imagem"), async (req, res) => {
  try {
      // Agora recebemos também o 'nome' e 'confsenha' do body
      const { nome, email, senha, confsenha } = req.body;

      const imagem = req.file
          ? "/imagens/" + req.file.filename
          : "/imagens/def_avt.jpg";

      // 1. Validações
      if (!nome || nome.trim() === "") return res.status(400).json({ "resposta": "Preencha o nome" });
      if (!email || !email.includes('@')) return res.status(400).json({ "resposta": "E-mail inválido" });
      if (senha !== confsenha) return res.status(400).json({ "resposta": "As senhas não coincidem" });

      // 2. Verificar se o usuário já existe
      const [usuarios] = await conexao.query("SELECT * FROM cadastro WHERE email = ?", [email]);
      if (usuarios.length > 0) {
          return res.status(400).json({ "resposta": "Este e-mail já está cadastrado." });
      }

      // 3. Criptografar a senha
      const senhaHashed = crypto.createHash("sha256").update(senha.trim()).digest("hex");

      // 4. SALVAR (Incluindo nome e foto)
      // Certifique-se de que sua tabela 'cadastro' tenha as colunas 'nome' e 'foto'
      const sql = "INSERT INTO cadastro (nome, email, senha, img) VALUES (?, ?, ?, ?)";
      await conexao.query(sql, [nome, email, senhaHashed, imagem]);

      return res.status(201).json({ "resposta": "Cadastro realizado com sucesso!" });

  } catch (error) {
      console.error("Erro no cadastro:", error);
      return res.status(500).json({ "resposta": "Erro interno do Servidor." });
  }
});
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

      // Retornamos os dados que a sidebar vai precisar
      return res.json({
          "resposta": "Login realizado com sucesso!",
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
 // ----- Atualizar perfil
app.put("/perfil/atualizar", uploadPerfil.single('imagem'), async (req, res) => {
  try {
      const { nome, email, emailAntigo, nova_senha, conf_senha } = req.body;
      let novaFotoPath = null;

      // Se o usuário enviou uma foto nova
      if (req.file) {
          novaFotoPath = `/imagens/${req.file.filename}`;;
      }

      // Validação básica de senha
      let senhaSql = "";
      let params = [nome, email];

      if (nova_senha && nova_senha === conf_senha) {
          const senhaHashed = crypto.createHash("sha256").update(nova_senha.trim()).digest("hex");
          senhaSql = `, senha = ?`;
          params.push(senhaHashed);
      }

      // Se houver foto nova, adiciona ao SQL
      let fotoSql = "";
      if (novaFotoPath) {
          fotoSql = `, img = ?`;
          params.push(novaFotoPath);
      }

      // O emailAntigo é usado no WHERE para saber qual usuário atualizar
      params.push(emailAntigo);

      const sql = `UPDATE cadastro SET nome = ?, email = ? ${senhaSql} ${fotoSql} WHERE email = ?`;
      
      const [resultado] = await conexao.query(sql, params);

      if (resultado.affectedRows > 0) {
          return res.json({
              "resposta": "Perfil atualizado com sucesso!",
              "novoNome": nome,
              "novoEmail": email,
              "novaFoto": novaFotoPath // Retorna o novo caminho para o frontend atualizar o localStorage
          });
      } else {
          return res.status(400).json({ "resposta": "Usuário não encontrado ou sem alterações." });
      }

  } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      return res.status(500).json({ "resposta": "Erro interno ao atualizar." });
  }
});

//--------Atualizar Produtos
// BUSCAR 1 PRODUTO
app.get("/produtos/:id", async (req, res) => {
  const { id } = req.params;

  const [rows] = await conexao.query(
    "SELECT * FROM produtos WHERE id_produto = ?",
    [id]
  );

  res.json(rows[0]);
});

// ATUALIZAR PRODUTO
app.put("/produtos/:id", uploadProduto.single("img"), async (req, res) => {
  const { id } = req.params;

  const {
    nome,
    codigo_barras,
    preco,
    qtd,
    dt_validade,
    descricao
  } = req.body;

  let img = null;

  if (req.file) {
    img = req.file.filename;
  }

  await conexao.query(`
    UPDATE produtos SET
      nome = ?,
      codigo_barras = ?,
      preco = ?,
      qtd = ?,
      dt_validade = ?,
      descricao = ?,
      img = COALESCE(?, img)
    WHERE id_produto = ?
  `, [nome, codigo_barras, preco, qtd, dt_validade, descricao, img, id]);

  res.json({ msg: "ok" });
});

//--------- PRODUTOS (PDV e Cadastro)

app.post("/produtos", uploadProdutos.single("imagem"), async (req, res) => {
  try {
    const { nome, preco, codigo_barras } = req.body;
    // Substitui vírgula por ponto para o banco aceitar como decimal
    const precoFormatado = preco.replace(",", ".");

      const imagem = req.file
        ? "/images/" + req.file.filename
        : null;
    const sql = `
      INSERT INTO produtos (nome, preco, codigo_barras, img)
      VALUES (?, ?, ?, ?)
    `;

    await conexao.query(sql, [nome, precoFormatado, codigo_barras, imagem]);

    res.json({ mensagem: "Produto cadastrado com sucesso" });

  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Erro ao cadastrar produto" });
  }
});

//-----Busca
app.get("/produtos/busca", async (req, res) => {
  try {
    const q = req.query.q;

    const [rows] = await conexao.query(`
      SELECT id_produto, nome, codigo_barras, preco
      FROM produtos
      WHERE 
        TRIM(codigo_barras) = ?
      LIMIT 10
    `, [q, `%${q}%`]);

    console.log(rows); // ✔ console no lugar certo

    return res.json(rows); // ✔ só uma resposta

  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: "Erro na busca" });
  }
});
app.get("/produtos/:codigo", async (req, res) => {
  try {
    const codigo = req.params.codigo;

    const [rows] = await conexao.query(
      "SELECT * FROM produtos WHERE codigo_barras = ?",
      [codigo]
    );

    if (rows.length === 0) return res.status(404).json({ erro: "Produto não encontrado" });

    res.json(rows); // retorna o produto como array para o PDV
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Erro ao buscar produto" });
  }
});

//----Pedidos
app.post("/pedidos", async (req, res) => {
  try {
    const { itens, total, form_pag } = req.body;

    // pega último pedido
    const [ultimo] = await conexao.query(`
      SELECT num_pedido FROM pedidos 
      ORDER BY id_pedido DESC LIMIT 1
    `);

    let numero = 1;

    if (ultimo.length > 0) {
      numero = parseInt(ultimo[0].num_pedido) + 1;
    }

    const numeroFormatado = String(numero).padStart(3, "0");

    // 🔥 COLOCA AQUI
    const qtd_total = itens.reduce((soma, item) => soma + item.qtd, 0);

    // 🔥 SUBSTITUI TEU INSERT POR ESSE
    const [result] = await conexao.query(`
      INSERT INTO pedidos (num_pedido, id_user, valor_total, qtd_total, form_pag)
      VALUES (?, ?, ?, ?, ?)
    `, [numeroFormatado, 1, total, qtd_total, form_pag]);

    const idPedido = result.insertId;

    // itens
    for (let item of itens) {
      await conexao.query(`
        INSERT INTO pedidos_itens (id_pedido, id_produto, qtd, preco_unitario)
        VALUES (?, ?, ?, ?)
      `, [idPedido, item.id_produto, item.qtd, item.preco]);
    }

    res.json({ num_pedido: numeroFormatado });

  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao salvar pedido" });
  }
});
//-------------------------------- ESTOQUE
app.get("/produtos", async (req, res) => {
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
app.put("/produtos/:codigo/add", async (req, res) => {
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