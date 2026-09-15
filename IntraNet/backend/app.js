const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const path = require("path");
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../../Docs/swagger.json');
console.log('SWAGGER CARREGADO:', require.resolve('../../Docs/swagger.json'));
console.log('TOTAL DE ROTAS:', Object.keys(swaggerDocument.paths || {}).length);

require('dotenv').config();

const conexao = require('./db.js');

const app = express();

const porta = 3000;
// =====================================================
// JSON + CORS (Devem vir PRIMEIRO)
// =====================================================

app.use(express.json());
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'bypass-tunnel-reminder']
}));


// =====================================================
// SWAGGER (Vem DEPOIS do JSON e CORS)
// =====================================================

app.use(
    '/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument)
);


// =====================================================
// FONTS
// =====================================================

app.use(
    '/fonts',
    express.static(
        path.join(__dirname, 'fonts')
    )
);

// =====================================================
// IMAGENS
// =====================================================

// Imagens de produtos
const pastaImagesFrontend = path.join(
    __dirname,
    '../frontend/images'
);

if (!fs.existsSync(pastaImagesFrontend)) {

    fs.mkdirSync(
        pastaImagesFrontend,
        { recursive: true }
    );

}

app.use(
    '/images',
    express.static(pastaImagesFrontend)
);


// Imagens de perfil
const pastaImagensBackend = path.join(
    __dirname,
    'imagens'
);

if (!fs.existsSync(pastaImagensBackend)) {

    fs.mkdirSync(
        pastaImagensBackend,
        { recursive: true }
    );

}

app.use(
    '/imagens',
    express.static(pastaImagensBackend)
);


// =====================================================
// VIEW ENGINE
// =====================================================

app.set(
    'view engine',
    'ejs'
);

app.set(
    'views',
    path.join(__dirname, 'views')
);


// =====================================================
// ROTAS
// =====================================================

const authRoutes = require('./routes/authRoutes');
const perfilRoutes = require('./routes/perfilRoutes');
const produtosRoutes = require('./routes/produtosRoutes');
const pedidosRoutes = require('./routes/pedidosRoutes');
const estoqueRoutes = require('./routes/estoqueRoutes');
const reposicaoRoutes = require('./routes/reposicaoRoutes');
const agendamentoRoutes = require('./routes/agendamentoRoutes');
const fiadoRoutes = require('./routes/fiadoRoutes.js');
const dashboardRoutes = require('./routes/dashboardRoutes');
const pdfRoutes = require('./routes/pdfRoutes');
const authAppRoutes = require('./routes/authAppRoutes');
const fechamentoRoutes = require('./routes/fechamentoRoutes');


// =====================================================
// USO DAS ROTAS
// =====================================================

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

app.use(fechamentoRoutes);


// =====================================================
// START SERVER
// =====================================================

const HOST = '0.0.0.0'; // Libera o acesso para qualquer IP da rede

app.listen(porta, HOST, () => {
    console.log(`Servidor rodando em http://${HOST}:${porta}`);
});