const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../../Docs/swagger.json');

require('dotenv').config();

const { zerarEstoqueCafeDiario } = require('./utils/estoqueLiquidos');

const app = express();
const porta = process.env.PORT || 3000;

const frontendPath = path.resolve(__dirname, '../frontend');
app.use(express.static(frontendPath));

// rota principal //
app.get('/', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

app.use(express.json());
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'bypass-tunnel-reminder']
}));

// documentacao swagger //
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/fonts', express.static(path.join(__dirname, 'fonts')));

const pastaImagesFrontend = path.join(__dirname, '../frontend/images');
if (!fs.existsSync(pastaImagesFrontend)) {
    fs.mkdirSync(pastaImagesFrontend, { recursive: true });
}
app.use('/images', express.static(pastaImagesFrontend));

const pastaImagensBackend = path.join(__dirname, 'imagens');
if (!fs.existsSync(pastaImagensBackend)) {
    fs.mkdirSync(pastaImagensBackend, { recursive: true });
}
app.use('/imagens', express.static(pastaImagensBackend));
app.use('/backend/imagens', express.static(pastaImagensBackend));

const pastaLandingPage = path.join(frontendPath, 'landing_page');
app.use('/landing_page', express.static(pastaLandingPage));

// cardapio da landing page //
app.get('/landing_page/cardapio.html', (req, res) => {
    res.sendFile(path.join(pastaLandingPage, 'cardapio.html'));
});

const authRoutes = require('./routes/authRoutes');
const perfilRoutes = require('./routes/perfilRoutes');
const produtosRoutes = require('./routes/produtosRoutes');
const pedidosRoutes = require('./routes/pedidosRoutes');
const estoqueRoutes = require('./routes/estoqueRoutes');
const reposicaoRoutes = require('./routes/reposicaoRoutes');
const agendamentoRoutes = require('./routes/agendamentoRoutes');
const fiadoRoutes = require('./routes/fiadoRoutes');
const authAppRoutes = require('./routes/authAppRoutes');
const fechamentoRoutes = require('./routes/fechamentoRoutes');

app.use(authRoutes);
app.use(perfilRoutes);
app.use(produtosRoutes);
app.use(pedidosRoutes);
app.use(estoqueRoutes);
app.use(reposicaoRoutes);
app.use(agendamentoRoutes);
app.use(fiadoRoutes);
app.use(authAppRoutes);
app.use(fechamentoRoutes);

let vendaEmAndamentoMonitor = false;

// consultar status do monitor //
app.get('/monitor/status', (req, res) => {
    res.json({ vendaEmAndamento: vendaEmAndamentoMonitor });
});

// atualizar status do monitor //
app.post('/monitor/status', (req, res) => {
    vendaEmAndamentoMonitor = req.body?.vendaEmAndamento === true;
    res.json({
        sucesso: true,
        vendaEmAndamento: vendaEmAndamentoMonitor
    });
});

async function iniciarServidor() {
    try {
        const resultadoReset = await zerarEstoqueCafeDiario();
        if (resultadoReset.zerado) {
            console.log(`Estoque compartilhado de café zerado em ${resultadoReset.data}.`);
        } else {
            console.log(`Estoque compartilhado de café já foi zerado hoje (${resultadoReset.data}).`);
        }

        app.listen(porta, '0.0.0.0', () => {
            console.log(`Servidor rodando na rede na porta ${porta}`);
        });
    } catch (erro) {
        console.error('Não foi possível preparar o estoque diário de café. Servidor não iniciado:', erro);
        process.exit(1);
    }
}

iniciarServidor();
