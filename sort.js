// Ordenação por clique no título das colunas de todas as tabelas do painel.
// 1º clique: números do maior para o menor (texto A→Z); 2º clique inverte; 3º volta à ordem original.
// Linhas de total e de aviso ("Sem dados…") ficam sempre no fim. A escolha fica salva no navegador.
(() => {
  const CHAVE = 'painel-ordem';
  let estado = {};
  try { estado = JSON.parse(localStorage.getItem(CHAVE)) || {}; } catch (e) {}
  const salvar = () => { try { localStorage.setItem(CHAVE, JSON.stringify(estado)); } catch (e) {} };

  const hoje = new Date();
  function valor(td) {
    if (!td) return null;
    const bruto = td.dataset.sort != null ? td.dataset.sort : td.textContent;
    const t = bruto.trim();
    if (!t || t === '—' || t === '-' || t === 'n/d') return null;
    // data dd/mm ou dd/mm/aaaa
    let m = t.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
    if (m) {
      let a = m[3] ? +m[3] : hoje.getFullYear(); if (a < 100) a += 2000;
      if (!m[3] && +m[2] > hoje.getMonth() + 2) a -= 1;
      return {n: new Date(a, +m[2] - 1, +m[1]).getTime()};
    }
    // número: R$ 1.234,56 · 12,3% · 1.234 · 5 dias · 1,8x
    m = t.replace(/^R\$\s*/, '').match(/^([-+−]?)\s*(\d{1,3}(?:\.\d{3})*|\d+)(?:,(\d+))?\s*(%|x|×|dias?|d|mil|k)?(\s.*)?$/i);
    if (m && !(m[5] && /[a-z]/i.test(m[5]) && !m[4])) {
      let n = parseFloat(m[2].replace(/\./g, '') + (m[3] ? '.' + m[3] : ''));
      if (m[1] === '-' || m[1] === '−') n = -n;
      if (/^(mil|k)$/i.test(m[4] || '')) n *= 1000;
      return {n};
    }
    return {s: t.toLocaleLowerCase('pt-BR')};
  }

  function nomeDe(tb) { return tb && tb.dataset.draw; }

  function aplicar(tb) {
    const nome = nomeDe(tb); if (!nome) return;
    const table = tb.closest('table'), ths = table.tHead ? [...table.tHead.rows[0].cells] : [];
    const st = estado[nome];
    ths.forEach((th, i) => {
      th.classList.add('ordenavel');
      th.classList.toggle('ord-desc', !!st && st.col === i && st.dir === 'desc');
      th.classList.toggle('ord-asc', !!st && st.col === i && st.dir === 'asc');
      th.setAttribute('aria-sort', st && st.col === i ? (st.dir === 'asc' ? 'ascending' : 'descending') : 'none');
    });
    const todas = [...tb.rows];
    todas.forEach((tr, i) => { if (tr.dataset.i == null) tr.dataset.i = i; });
    const fixas = todas.filter((tr) => tr.classList.contains('linha-total') || tr.cells.length < ths.length);
    const dados = todas.filter((tr) => !fixas.includes(tr));
    if (dados.length < 2) return;
    if (!st) { dados.sort((a, b) => a.dataset.i - b.dataset.i); }
    else {
      const sinal = st.dir === 'asc' ? 1 : -1;
      const v = new Map(dados.map((tr) => [tr, valor(tr.cells[st.col])]));
      dados.sort((a, b) => {
        const x = v.get(a), y = v.get(b);
        if (x == null && y == null) return a.dataset.i - b.dataset.i;
        if (x == null) return 1; if (y == null) return -1; // vazios sempre no fim
        let r;
        if (x.n != null && y.n != null) r = x.n - y.n;
        else if (x.n != null) r = -1; else if (y.n != null) r = 1;
        else r = x.s.localeCompare(y.s, 'pt-BR', {numeric: true});
        return r * sinal || a.dataset.i - b.dataset.i;
      });
    }
    tb.append(...dados, ...fixas.sort((a, b) => a.dataset.i - b.dataset.i));
  }

  function aplicarTodas() { document.querySelectorAll('.mb table tbody[data-draw]').forEach(aplicar); }

  document.addEventListener('click', (ev) => {
    const th = ev.target.closest('.mb thead th'); if (!th || ev.target.closest('a,button,input,select')) return;
    const table = th.closest('table'), tb = table.querySelector('tbody[data-draw]'), nome = nomeDe(tb); if (!nome) return;
    const col = th.cellIndex, st = estado[nome];
    if (!st || st.col !== col) {
      const amostra = [...tb.rows].map((tr) => valor(tr.cells[col])).find((x) => x);
      estado[nome] = {col, dir: amostra && amostra.n == null ? 'asc' : 'desc'};
    } else {
      const primeiro = valor([...tb.rows].map((tr) => tr.cells[col]).find((td) => valor(td))) || {};
      const inicial = primeiro.n == null ? 'asc' : 'desc';
      if (st.dir === inicial) st.dir = inicial === 'asc' ? 'desc' : 'asc';
      else delete estado[nome];
    }
    salvar();
    aplicar(tb);
  });

  const css = document.createElement('style');
  css.textContent = `.mb th.ordenavel{cursor:pointer;user-select:none}
.mb th.ordenavel:hover{color:var(--color-fg,inherit);text-decoration:underline dotted}
.mb th.ordenavel::after{content:'⇅';opacity:.25;margin-left:4px;font-size:.9em}
.mb th.ord-desc::after{content:'▼';opacity:.8}
.mb th.ord-asc::after{content:'▲';opacity:.8}
.mb th.ord-desc,.mb th.ord-asc{color:var(--color-fg,inherit)}`;
  document.head.append(css);

  if (window.dash) dash.onData(aplicarTodas);
  document.addEventListener('DOMContentLoaded', aplicarTodas);
})();
