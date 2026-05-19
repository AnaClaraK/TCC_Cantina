const multer = require("multer");
const path = require("path");
// MULTER PARA PRODUTOS (frontend - comidas)
const storageProdutos = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, "../frontend/images"));
    },
  
    filename: function (req, file, cb) {
      const nomeUnico = Date.now() + path.extname(file.originalname);
      cb(null, nomeUnico);
    }
  });
  
  const uploadProdutos = multer({ storage: storageProdutos });
  
  
  // MULTER PARA PERFIL (backend - pessoal)
  const storagePerfil = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "imagens/");
    },
    filename: function (req, file, cb) {
      const nomeUnico = Date.now() + path.extname(file.originalname);
      cb(null, nomeUnico);
    }
  });
  
  // MULTER PARA Produtos (backend - pessoal)
  const uploadPerfil = multer({ storage: storagePerfil });
  
  const storageProduto = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "imagens/"); // mesma pasta do perfil
    },
    filename: function (req, file, cb) {
      const nomeUnico = Date.now() + path.extname(file.originalname);
      cb(null, nomeUnico);
    }
  });
  
  const uploadProduto = multer({ storage: storageProduto });
  module.exports = {
    uploadProdutos,
    uploadPerfil,
    uploadProduto
  };