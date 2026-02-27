//Meu arquivo de conexão com o banco de dados
const mysql = require('mysql2/promise')

//pool de conexão

const conexao = mysql.createPool({//(o nome)conexao tem q ser o msm la em baixo
    //criar as configurações do DB
    //host é o endereço do DB
    host:"localhost",
    user:"root",
    password:"",
    port:3306,
    database:"cantina",
    waitForConnections:true,
    connectionLimit:10,
    queueLimit:0

})
// 
module.exports = conexao//desse aq