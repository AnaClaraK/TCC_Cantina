const express = require('express')
const cors = require('cors')
const crypto = require('crypto')
const multer = require("multer");
const path = require("path");
const conexao = require('./db.js') // Certifique-se que o db.js está na mesma pasta

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
app.use('/images', express.static(path.join(__dirname, 'images')));

app.listen(porta, () => { 
  console.log(`Servidor rodando em: http://localhost:${porta}`)
})

// Configuração do Multer para upload de fotos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "imagens/");
  },
  filename: function (req, file, cb) {
    const nomeUnico = Date.now() + path.extname(file.originalname);
    cb(null, nomeUnico);
  }
});

const upload = multer({ storage });

//---------------------------------------------------------------------------------

//--------Funcionários
app.post("/cadastro", async (req, res) => {
  try {
      const { email, senha, confsenha } = req.body

      // 1. Validações de preenchimento
      if (!email || email.trim() === "") {
          return res.status(400).json({ "resposta": "Preencha o e-mail" })
      } 
      if (!email.includes('@') || !email.includes('.')) {
          return res.status(400).json({ "resposta": "O e-mail deve ter o formato correto" })
      } 
      if (!senha || senha.trim() === "") {
          return res.status(400).json({ "resposta": "Preencha a senha" })
      }
      // Nota: Se o frontend não enviar confsenha, a validação abaixo retornará erro.
      if (!confsenha || confsenha.trim() === "") {
          return res.status(400).json({ "resposta": "Confirme a senha" })
      }
      if (senha.trim() !== confsenha.trim()) {
          return res.status(400).json({ "resposta": "As senhas não coincidem" })
      }

      // 2. Verificar se o usuário já existe
      const [usuarios] = await conexao.query("SELECT * FROM cadastro WHERE email = ?", [email])
      
      if (usuarios.length > 0) {
          return res.status(400).json({ "resposta": "Este e-mail já está cadastrado." })
      }

      // 3. Criptografar a senha
      const senhaHashed = crypto.createHash("sha256").update(senha.trim()).digest("hex")

      // 4. SALVAR no banco de dados (O que faltava)
      const sql = "INSERT INTO cadastro (email, senha) VALUES (?, ?)"
      await conexao.query(sql, [email, senhaHashed])

      return res.status(201).json({ "resposta": "Cadastro realizado com sucesso!" })

  } catch (error) {
      console.error("Erro no processo de cadastro:", error)
      return res.status(500).json({ "resposta": "Erro interno do Servidor." })
  }
})

app.post("/login", async (req, res) => {
  try {
      const { email } = req.body
      let { senha } = req.body

      senha = senha.trim()

      if (email == "") {
          return res.status(400).json({ "resposta": "Preencha o e-mail" })
      } else if (!email.includes('@') || !email.includes('.')) {
          return res.status(400).json({ "resposta": "O e-mail deve ter o formato correto" })
      } else if (senha == "") {
          return res.status(400).json({ "resposta": "Preencha a senha" })
      }

      const senhaHashed = crypto.createHash("sha256").update(senha).digest("hex")

      const sql = `SELECT * FROM cadastro WHERE email = ?`

      let [usuarios] = await conexao.query(sql, [email])
      
      if (usuarios.length === 0) {
          return res.status(401).json({ "resposta": "E-mail ou senha inválidos." })
      }

      const usuario = usuarios[0]
      
      if (usuario.senha === senhaHashed) {
          return res.json({ "resposta": "Login realizado com sucesso!" })
      } else {
          return res.status(401).json({ "resposta": "E-mail ou senha inválidos." })
      }

  } catch (error) {
      console.error("Erro no processo de login:", error)
      return res.status(500).json({ "resposta": "Erro interno do Servidor." })
  }
})

//--------- PRODUTOS (PDV e Cadastro)

app.post("/produtos", upload.single("imagem"), async (req, res) => {
  try {
    const { nome, preco, codigo_barras } = req.body;
    // Substitui vírgula por ponto para o banco aceitar como decimal
    const precoFormatado = preco.replace(",", ".");

    const imagem = req.file
      ? "/imagens/" + req.file.filename
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

//-------------------------------- ESTOQUE

app.get("/produtos", async (req, res) => {
  try {
    // Busca todos os produtos para exibir na tabela do estoque
    const [rows] = await conexao.query("SELECT p.*, c.nome AS categoria_nome FROM produtos p JOIN categorias c ON p.id_categoria = c.id_categoria");
    
    // Envia a lista para o seu HTML
    res.json(rows);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Erro ao buscar a lista de produtos" });
  }
});
// GET produtos
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