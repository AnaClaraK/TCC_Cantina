const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../../Docs/swagger.json');

console.log(
    'SWAGGER CARREGADO:',
    require.resolve('../../Docs/swagger.json')
);

console.log(
    'TOTAL DE ROTAS:',
    Object.keys(swaggerDocument.paths || {}).length
);

require('dotenv').config();

const conexao = require('./db.js');

const app = express();

const porta = 3000;


/* =====================================================
   FRONTEND
===================================================== */

const frontendPath = path.resolve(
    __dirname,
    '../frontend'
);

app.use(
    express.static(frontendPath)
);


/* =====================================================
   ROTA PRINCIPAL
===================================================== */

app.get('/', (req, res) => {
    res.sendFile(
        path.join(
            frontendPath,
            'index.html'
        )
    );
});


/* =====================================================
   JSON + CORS
===================================================== */

app.use(express.json());

app.use(cors({
    origin: '*',
    methods: [
        'GET',
        'POST',
        'PUT',
        'DELETE',
        'OPTIONS'
    ],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'bypass-tunnel-reminder'
    ]
}));


/* =====================================================
   SWAGGER
===================================================== */

app.use(
    '/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument)
);


/* =====================================================
   FONTS
===================================================== */

app.use(
    '/fonts',
    express.static(
        path.join(
            __dirname,
            'fonts'
        )
    )
);


/* =====================================================
   IMAGENS
===================================================== */


/*
 * Imagens dos produtos
 * frontend/images
 */

const pastaImagesFrontend = path.join(
    __dirname,
    '../frontend/images'
);

if (!fs.existsSync(pastaImagesFrontend)) {

    fs.mkdirSync(
        pastaImagesFrontend,
        {
            recursive: true
        }
    );

}

app.use(
    '/images',
    express.static(
        pastaImagesFrontend
    )
);


/*
 * Imagens do backend
 * backend/imagens
 */

const pastaImagensBackend = path.join(
    __dirname,
    'imagens'
);

if (!fs.existsSync(pastaImagensBackend)) {

    fs.mkdirSync(
        pastaImagensBackend,
        {
            recursive: true
        }
    );

}

app.use(
    '/imagens',
    express.static(
        pastaImagensBackend
    )
);


/*
 * Compatibilidade com caminhos antigos
 *
 * Alguns arquivos usam:
 *
 * ../backend/imagens/arquivo.png
 *
 * Quando estão sendo executados pelo localhost:3000,
 * esse caminho pode virar:
 *
 * /backend/imagens/arquivo.png
 *
 * Então essa rota aponta para a mesma pasta.
 */

app.use(
    '/backend/imagens',
    express.static(
        pastaImagensBackend
    )
);


/* =====================================================
   LANDING PAGE / CARDÁPIO
===================================================== */

const pastaLandingPage = path.join(
    frontendPath,
    'landing_page'
);


/*
 * Serve todos os arquivos da pasta:
 *
 * frontend/landing_page
 */

app.use(
    '/landing_page',
    express.static(
        pastaLandingPage
    )
);


/*
 * Garante especificamente o cardápio.
 */

app.get(
    '/landing_page/cardapio.html',
    (req, res) => {

        res.sendFile(
            path.join(
                pastaLandingPage,
                'cardapio.html'
            )
        );

    }
);


/* =====================================================
   VIEW ENGINE
===================================================== */

app.set(
    'view engine',
    'ejs'
);

app.set(
    'views',
    path.join(
        __dirname,
        'views'
    )
);


/* =====================================================
   ROTAS
===================================================== */

const authRoutes =
    require('./routes/authRoutes');

const perfilRoutes =
    require('./routes/perfilRoutes');

const produtosRoutes =
    require('./routes/produtosRoutes');

const pedidosRoutes =
    require('./routes/pedidosRoutes');

const estoqueRoutes =
    require('./routes/estoqueRoutes');

const reposicaoRoutes =
    require('./routes/reposicaoRoutes');

const agendamentoRoutes =
    require('./routes/agendamentoRoutes');

const fiadoRoutes =
    require('./routes/fiadoRoutes.js');

const authAppRoutes =
    require('./routes/authAppRoutes');

const fechamentoRoutes =
    require('./routes/fechamentoRoutes');


/* =====================================================
   USO DAS ROTAS
===================================================== */

app.use(
    authRoutes
);

app.use(
    perfilRoutes
);

app.use(
    produtosRoutes
);

app.use(
    pedidosRoutes
);

app.use(
    estoqueRoutes
);

app.use(
    reposicaoRoutes
);

app.use(
    agendamentoRoutes
);

app.use(
    fiadoRoutes
);

app.use(
    authAppRoutes
);

app.use(
    fechamentoRoutes
);


/* =====================================================
   MONITOR DO CARDÁPIO / PDV
===================================================== */

let vendaEmAndamentoMonitor =
    false;


app.get(
    '/monitor/status',
    (req, res) => {

        res.json({
            vendaEmAndamento:
                vendaEmAndamentoMonitor
        });

    }
);


app.post(
    '/monitor/status',
    (req, res) => {

        vendaEmAndamentoMonitor =
            req.body?.vendaEmAndamento === true;

        res.json({
            sucesso: true,

            vendaEmAndamento:
                vendaEmAndamentoMonitor
        });

    }
);


/* =====================================================
   START SERVER
===================================================== */

app.listen(
    porta,
    () => {

        console.log(
            `Servidor rodando em http://localhost:${porta}`
        );

    }
);