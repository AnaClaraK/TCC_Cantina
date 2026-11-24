const fs = require('fs');

const cssPdv = fs.readFileSync('IntraNet/frontend/stylepdv.css', 'utf8');
const lines = cssPdv.split(/\r?\n/);

console.log('--- Checking dialogCredito / dialogDinheiro in stylepdv.css ---');
lines.forEach((l, i) => {
  if (l.includes('#dialogCredito {') || l.includes('#dialogDinheiro {') || l.includes('#dialogDividirPagamento {') || l.includes('#d_fiado {')) {
    console.log(lines.slice(i, i + 14).join('\n'));
  }
});
