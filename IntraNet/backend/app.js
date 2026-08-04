require('dotenv').config();
require('./monitoramento.js');
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const path = require("path");
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const conexao = require('./db.js');

const app = express();
const SECRET = process.env.API_SEGREDO;

// ==========================================
// CONFIGURAÇÕES GLOBAIS (SEMPRE NO TOPO!)
// ==========================================
app.use(express.json());
app.use(cors()); // O CORS precisa vir antes de qualquer rota!

// ==========================================
// ARQUIVOS ESTÁTICOS (FRONTEND E IMAGENS)
// ==========================================
// Libera o HTML/CSS/JS do frontend para o cliente
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Libera as imagens do BACKEND
app.use('/imagens', express.static(path.join(__dirname, 'imagens')));

// Libera as imagens do FRONTEND (se houver essa pasta lá)
app.use('/images', express.static(path.join(__dirname, '..', 'frontend', 'images')));

// Libera as fontes
app.use('/fonts', express.static(path.join(__dirname, 'fonts')));

// ==========================================
// ROTAS DE PÁGINAS (HTML)
// ==========================================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'login.html'));
});

// Swagger
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// VIEW ENGINE
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ======================
// ROTAS (IMPORTAÇÃO)
// ======================
const authRoutes = require('./routes/authRoutes');
const perfilRoutes = require('./routes/perfilRoutes');
const produtosRoutes = require('./routes/produtosRoutes');
const pedidosRoutes = require('./routes/pedidosRoutes');
const estoqueRoutes = require('./routes/estoqueRoutes');
const reposicaoRoutes = require('./routes/reposicaoRoutes');
const agendamentoRoutes = require('./routes/agendamentoRoutes');
const fiadoRoutes = require('./routes/fiadoRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const pdfRoutes = require('./routes/pdfRoutes');
const authAppRoutes = require('./routes/authAppRoutes');

// ======================
// USO DAS ROTAS
// ======================
app.use(authRoutes);
app.use(perfilRoutes);
app.use(produtosRoutes);
app.use(pedidosRoutes);
app.use(estoqueRoutes);
app.use(reposicaoRoutes);
app.use(agendamentoRoutes);
app.use(fiadoRoutes);
app.use(dashboardRoutes);
app.use(pdfRoutes);
app.use(authAppRoutes);

// START SERVER
const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});