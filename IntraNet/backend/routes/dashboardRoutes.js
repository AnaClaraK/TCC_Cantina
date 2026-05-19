const express = require('express');
const router = express.Router();

// suas rotas aqui
router.get('/', (req, res) => {
  res.json({ ok: true });
});

module.exports = router;