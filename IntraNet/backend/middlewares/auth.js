const jwt =
require('jsonwebtoken');


require('dotenv').config(); 
const SECRET = process.env.API_SEGREDO;

function verificarToken(
    req,
    res,
    next
){

    const token =
    req.headers['authorization'];

    if(!token){

        return res.status(401).json({
            resposta:
            "Acesso negado. Faça login."
        });
    }

    const tokenLimpo =
    token.split(' ')[1]
    ||
    token;

    jwt.verify(
        tokenLimpo,
        SECRET,
        (err, decoded) => {

            if(err){

                return res.status(403).json({
                    resposta:
                    "Token inválido ou expirado."
                });
            }

            req.usuarioId =
            decoded.id;

            next();
        }
    );
}

module.exports =
verificarToken;