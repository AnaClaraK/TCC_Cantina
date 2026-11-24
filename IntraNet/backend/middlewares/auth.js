const jwt = require('jsonwebtoken');
require('dotenv').config();

const SECRET = process.env.API_SEGREDO;

function verificarToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && (authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader);

    if (!token) {
        return res.status(401).json({ resposta: "Acesso negado. Token não fornecido." });
    }

    try {
        const decoded = jwt.verify(token, SECRET);
        req.usuario = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ resposta: "Token inválido ou expirado." });
    }
}

module.exports = verificarToken;
