const multer = require("multer");
const path = require("path");
const fs = require("fs");

const pastaProdutos = path.join(__dirname, "../../frontend/images");
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

const uploadProdutos = multer({ storage: storageProdutos });

const pastaPerfil = path.join(__dirname, "../imagens");
if (!fs.existsSync(pastaPerfil)) {
    fs.mkdirSync(pastaPerfil, { recursive: true });
}

const storagePerfil = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, pastaPerfil);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}${ext}`);
    }
});

const uploadPerfil = multer({ storage: storagePerfil });

module.exports = {
    uploadProdutos,
    uploadPerfil
};
