const jwt = require('jsonwebtoken');
require('dotenv').config();

const SECRET = process.env.API_SEGREDO;

function verificarToken(req, res, next) {
    const authHeader = req.headers['authorization'];

    // Garante a leitura do token mesmo se vier com "Bearer " ou apenas a string
    const token = authHeader && (authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader);

    if (!token) {
        return res.status(401).json({ resposta: "Acesso negado. Token não fornecido." });
    }

    try {
        const decoded = jwt.verify(token, SECRET);
        req.usuario = decoded; // Armazena { id: usuario.id_cadastro }
        next();
    } catch (err) {
        return res.status(401).json({ resposta: "Token inválido ou expirado." });
    }
}

module.exports = verificarToken;