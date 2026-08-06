const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const path = require("path");
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
require('dotenv').config();
const conexao = require('./db.js');

const app = express();
const porta = 3000;
const SECRET = process.env.API_SEGREDO;

// Swagger
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Fonts
app.use('/fonts', express.static(path.join(__dirname, 'fonts')));

// JSON + CORS
app.use(express.json());
app.use((req, res, next) => {
    console.log(req.method, req.url);
    next();
});
app.use(cors());

// Imagens
app.use('/images', express.static(path.join(__dirname, '../frontend/images')));
app.use('/imagens', express.static(path.join(__dirname, 'imagens')));

// VIEW ENGINE
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// START SERVER
app.listen(porta, () => {
  console.log(`Servidor rodando em: http://localhost:${porta}`);
});


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
