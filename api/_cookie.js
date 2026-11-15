// Valor do cookie de acesso: um código derivado da senha (a senha em si não vai para o navegador).
const crypto = require('crypto');

function valorCookie(senha) {
  return crypto.createHmac('sha256', senha).update('painel-funil-moombox-v1').digest('hex');
}

function temCookie(req, senha) {
  const esperado = 'painel=' + valorCookie(senha);
  return (req.headers.cookie || '').split(';').some((p) => p.trim() === esperado);
}

module.exports = { valorCookie, temCookie };
