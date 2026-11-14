// Motor mínimo do painel: busca as fontes em /api/source, roda loaders e cálculos,
// e redesenha os elementos com data-draw quando dados ou filtros mudam.
(function () {
  const loaders = {}, calcs = {}, draws = {}, onDataFns = [];
  const fontes = {};
  let memo = {};
  const PADRAO = { periodo: '30', perfil: 'todos', de: '', ate: '' };
  let params = Object.assign({}, PADRAO);
  try { Object.assign(params, JSON.parse(localStorage.getItem('painel-filtros') || '{}')); } catch (e) {}
  let liberado = false, agendado = false;

  const vazio = (status, message) => ({ status, data: [], message: message || '', refreshing: false, truncated: false, meta: null, columns: [] });

  async function buscar(id) {
    const r = await fetch('/api/source?id=' + encodeURIComponent(id), { credentials: 'same-origin' });
    if (r.status === 401) { pedirSenha(); throw new Error('Sem acesso'); }
    return r.json();
  }

  async function carregar(id) {
    fontes[id] = fontes[id] && fontes[id].status === 'ok' ? Object.assign({}, fontes[id], { refreshing: true }) : vazio('loading');
    try {
      const answer = await buscar(id);
      let out;
      if (loaders[id]) out = await loaders[id]({ answer, call: () => buscar(id), args: {} });
      else {
        if (answer && answer.error) throw new Error(answer.error.message || String(answer.error));
        out = { rows: Array.isArray(answer) ? answer : (answer.rows || answer.data || answer.results || []) };
      }
      const rows = out.rows || [];
      fontes[id] = { status: 'ok', data: rows, columns: out.columns || (rows[0] ? Object.keys(rows[0]) : []), message: '', refreshing: false, truncated: !!out.truncated, meta: null };
    } catch (e) {
      console.error('Fonte ' + id + ':', e);
      fontes[id] = vazio('error', e.message || String(e));
    }
    agendar();
  }

  function fonte(id) {
    if (!liberado) return vazio('loading');
    if (!fontes[id]) carregar(id);
    return fontes[id];
  }

  function calcular(id) {
    if (memo[id]) return memo[id];
    const c = calcs[id];
    const ins = c.inputs.map((i) => (calcs[i] ? calcular(i) : fonte(i)));
    const ruim = ins.find((d) => d.status !== 'ok');
    let res;
    if (ruim) res = { status: ruim.status === 'error' ? 'error' : 'loading', data: null, message: ruim.message || '', refreshing: false, truncated: false, meta: null };
    else {
      try {
        const v = c.fn.apply(null, c.inputs.map((i, k) => (calcs[i] ? ins[k].data : (Array.isArray(ins[k].data) ? ins[k].data : []))));
        res = { status: 'ok', data: v, columns: Array.isArray(v) && v[0] ? Object.keys(v[0]) : [], message: '', refreshing: false, truncated: false, meta: null };
      } catch (e) {
        console.error('Cálculo ' + id + ':', e);
        res = { status: 'error', data: null, message: e.message, refreshing: false, truncated: false, meta: null };
      }
    }
    memo[id] = res;
    return res;
  }

  function desenhar() {
    agendado = false;
    memo = {};
    Object.keys(draws).forEach((nome) => {
      document.querySelectorAll('[data-draw="' + nome + '"]').forEach((el) => {
        try { draws[nome](el); } catch (e) { console.error('Desenho ' + nome + ':', e); }
      });
    });
    onDataFns.forEach((fn) => { try { fn(); } catch (e) { console.error(e); } });
  }
  function agendar() { if (!agendado) { agendado = true; requestAnimationFrame(desenhar); } }

  window.dash = {
    loader(id, o) { loaders[id] = o.fn; },
    calc(id, o) { calcs[id] = o; },
    draw(nome, fn) { draws[nome] = fn; agendar(); },
    onData(fn) { onDataFns.push(fn); agendar(); },
    data(id) { return calcs[id] ? calcular(id) : fonte(id); },
    params() { return Object.assign({}, params); },
    setParams(p) { Object.assign(params, p); try { localStorage.setItem('painel-filtros', JSON.stringify(params)); } catch (e) {} agendar(); },
    resetParams() { params = Object.assign({}, PADRAO); agendar(); },
    refresh(id) { carregar(id); },
    setLink() {},
    colors: ['#c96442', '#3d6fb6', '#5a9e6f', '#b58a2e', '#8a63b8', '#4a9aa5'],
  };

  let largura = window.innerWidth;
  window.addEventListener('resize', () => { if (Math.abs(window.innerWidth - largura) > 20) { largura = window.innerWidth; agendar(); } });

  function pedirSenha() {
    if (document.getElementById('login')) return;
    const box = document.createElement('div');
    box.id = 'login';
    box.innerHTML = '<form><h2>Painel Moombox</h2><input type="password" placeholder="Senha" autocomplete="current-password" required><button>Entrar</button><p class="erro" hidden>Senha incorreta.</p></form>';
    document.body.append(box);
    const f = box.querySelector('form');
    f.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const r = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ senha: f.querySelector('input').value }) });
      if (r.ok) { box.remove(); liberado = true; Object.keys(fontes).forEach((k) => delete fontes[k]); agendar(); }
      else f.querySelector('.erro').hidden = false;
    });
    f.querySelector('input').focus();
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const r = await fetch('/api/login', { credentials: 'same-origin' });
    if (r.ok) { liberado = true; agendar(); } else pedirSenha();
  });
})();
