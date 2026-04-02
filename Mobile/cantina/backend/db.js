//Meu arquivo de conexão com o banco de dados
const mysql = require('mysql2/promise')
require('dotenv').config()

const pool = mysql.createPool({//(o nome)pool tem q ser o msm la em baixo
    "host":process.env.DB_LOCAL,
    "user":process.env.DB_USER,
    "password":process.env.DB_PASSWORD,
    "port":process.env.DB_PORTA,
    "database":process.env.DB_DATABASE,
})
// 
module.exports = pool//desse aq