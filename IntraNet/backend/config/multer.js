const multer = require("multer");
const path = require("path");
const fs = require("fs");

// =====================================================
// MULTER PARA PRODUTOS
// =====================================================

const pastaProdutos = path.join(__dirname, "../../frontend/images");

// Garante que a pasta exista
if (!fs.existsSync(pastaProdutos)) {
    fs.mkdirSync(pastaProdutos, { recursive: true });
}

const storageProdutos = multer.diskStorage({

    destination: function (req, file, cb) {
        cb(null, pastaProdutos);
    },

    filename: function (req, file, cb) {

        const ext = path.extname(file.originalname);

        const nomeBase = (req.body.img_nome || "produto")
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "_")
            .replace(/[^a-z0-9_]/g, "");

        cb(null, `${nomeBase}${ext}`);
    }

});

const uploadProdutos = multer({
    storage: storageProdutos
});


// =====================================================
// MULTER PARA FOTO DE PERFIL
// =====================================================

// config/multer.js está dentro de:
// backend/config/
//
// Então:
// ../imagens = backend/imagens

const pastaPerfil = path.join(__dirname, "../imagens");

// Garante que a pasta exista
if (!fs.existsSync(pastaPerfil)) {
    fs.mkdirSync(pastaPerfil, { recursive: true });
}

const storagePerfil = multer.diskStorage({

    destination: function (req, file, cb) {
        cb(null, pastaPerfil);
    },

    filename: function (req, file, cb) {

        const ext = path.extname(file.originalname);

        const nomeUnico = Date.now() + ext;

        cb(null, nomeUnico);
    }

});

const uploadPerfil = multer({
    storage: storagePerfil
});


// =====================================================
// EXPORTAÇÃO
// =====================================================

module.exports = {
    uploadProdutos,
    uploadPerfil
};