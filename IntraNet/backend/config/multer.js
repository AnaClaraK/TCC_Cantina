const multer = require("multer");
const path = require("path");
// MULTER PARA PRODUTOS (frontend - comidas)
const storageProdutos = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../frontend/images'));
  },

  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);

    const nomeBase = (req.body.img_nome || 'produto')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');

    cb(null, `${nomeBase}${ext}`);
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
  
// MULTER PARA PERFIL (backend)
const uploadPerfil = multer({ storage: storagePerfil });


module.exports = {
    uploadProdutos,
    uploadPerfil
};