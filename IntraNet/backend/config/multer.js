const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Função auxiliar para garantir que a pasta destino exista
const garantirPasta = (caminho) => {
  if (!fs.existsSync(caminho)) {
    fs.mkdirSync(caminho, { recursive: true });
  }
  return caminho;
};

// MULTER PARA PRODUTOS (Caminho corrigido subindo um nível além do backend)
const storageProdutos = multer.diskStorage({
  destination: function (req, file, cb) {
    // Subindo até a raiz do projeto para achar a pasta frontend real
    const caminhoDestino = path.resolve(__dirname, "..", "..", "frontend", "images");
    cb(null, garantirPasta(caminhoDestino));
  },
  filename: function (req, file, cb) {
    const nomeImagem = req.body.nome_imagem;

    cb(
        null,
        nomeImagem + path.extname(file.originalname)
    );
}
});
const uploadProdutos = multer({ storage: storageProdutos });

// MULTER PARA PERFIL (backend - pessoal)
const storagePerfil = multer.diskStorage({
  destination: function (req, file, cb) {
    const caminhoDestino = path.resolve(__dirname, "..", "imagens");
    cb(null, garantirPasta(caminhoDestino));
  },
  filename: function (req, file, cb) {
    const nomeUnico = Date.now() + path.extname(file.originalname);
    cb(null, nomeUnico);
  }
});
const uploadPerfil = multer({ storage: storagePerfil });

// MULTER PARA PRODUTOS (backend - cópia/reserva se necessário)
const storageProduto = multer.diskStorage({
  destination: function (req, file, cb) {
    const caminhoDestino = path.resolve(__dirname, "..", "imagens");
    cb(null, garantirPasta(caminhoDestino));
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