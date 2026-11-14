// Confere a senha do painel e grava um cookie de acesso por 30 dias.
module.exports = async (req, res) => {
  const senha = process.env.PAINEL_SENHA;
  if (req.method === 'GET') {
    const c = req.headers.cookie || '';
    const ok = !senha || c.split(';').some((p) => p.trim() === 'painel=' + encodeURIComponent(senha));
    res.status(ok ? 200 : 401).json({ ok });
    return;
  }
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  if (!senha || !body || body.senha !== senha) { res.status(401).json({ ok: false }); return; }
  res.setHeader('Set-Cookie', `painel=${encodeURIComponent(senha)}; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax`);
  res.status(200).json({ ok: true });
};
