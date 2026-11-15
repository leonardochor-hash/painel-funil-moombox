document.querySelectorAll('.mb-per').forEach((b) => b.addEventListener('click', () => dash.setParams({periodo: b.dataset.v, de: '', ate: ''})));
document.querySelectorAll('.mb-perfil').forEach((b) => b.addEventListener('click', () => dash.setParams({perfil: b.dataset.v})));
const lerDatas = () => {
  const de = document.getElementById('f-de'), ate = document.getElementById('f-ate');
  if (de && ate && de.value && de.validity.valid && ate.value && ate.validity.valid) dash.setParams({periodo: 'custom', de: de.value, ate: ate.value});
};
(() => { const sm = document.getElementById('f-mes'); if (!sm) return; const n = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'], h = new Date();
  for (let i = 0; i < 3; i++) { const d = new Date(h.getFullYear(), h.getMonth() - i, 1), v = 'mes:' + d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); const o = document.createElement('option'); o.value = v; o.textContent = n[d.getMonth()] + '/' + String(d.getFullYear()).slice(2) + (i === 0 ? ' (até hoje)' : ''); sm.append(o); }
  sm.addEventListener('change', () => { if (sm.value) dash.setParams({periodo: sm.value, de: '', ate: ''}); }); })();
document.querySelectorAll('.mb-date').forEach((el) => el.addEventListener('change', lerDatas));
dash.onData(() => {
  const p = dash.params(), pf = p.perfil || 'todos';
  document.querySelectorAll('.mb-per').forEach((b) => b.setAttribute('aria-pressed', String(p.periodo !== 'custom' && String(p.periodo || '30') === b.dataset.v)));
  const sm = document.getElementById('f-mes'); if (sm) sm.value = /^mes:/.test(p.periodo || '') ? p.periodo : '';
  document.querySelectorAll('.mb-perfil').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === pf)));
  const j = dash.data('janela');
  if (j.status === 'ok' && j.data && j.data[0]) {
    const de = document.getElementById('f-de'), ate = document.getElementById('f-ate');
    if (de && document.activeElement !== de) de.value = j.data[0].de;
    if (ate && document.activeElement !== ate) ate.value = j.data[0].ate;
  }
});
dash.draw('periodo-txt', (el) => {
  const j = dash.data('janela'), r = j.status === 'ok' && j.data && j.data[0];
  el.textContent = r ? (r.dias === 1 ? MB.dm(r.de) : MB.dm(r.de) + ' a ' + MB.dm(r.ate) + ' · ' + r.dias + ' dias') : '—';
});
dash.draw('t-perfil', (el) => { const pf = dash.params().perfil || 'todos'; el.textContent = pf === 'julia' ? 'Julia' : pf === 'moombox' ? 'Moombox' : 'Todos (Moombox + Julia)'; });

const campo = (src, name, field, fmt) => dash.draw(name, (el) => {
  const k = dash.data(src);
  el.textContent = (k.status === 'ok' && k.data && k.data[0]) ? fmt(k.data[0][field]) : '—';
});
const varia = (src, name, field, menorMelhor) => dash.draw(name, (el) => {
  const k = dash.data(src), v = k.status === 'ok' && k.data && k.data[0] ? k.data[0][field] : null;
  el.className = '';
  if (v == null || !isFinite(v)) { el.textContent = 's/ base'; return; }
  el.textContent = (v > 0 ? '▲ ' : v < 0 ? '▼ ' : '') + MB.pct(Math.abs(v));
  if (v !== 0) el.className = ((v > 0) !== !!menorMelhor) ? 'up' : 'down';
});
campo('kpis', 't-leads', 'leads', MB.int); campo('kpis', 't-taxa', 'taxa_aprov', MB.pct); campo('kpis', 't-expo', 'expositores', MB.int);
campo('kpis', 't-moo', 'leads_moombox', MB.int); campo('kpis', 't-jul', 'leads_julia', MB.int);
campo('kpis', 'k-leads', 'leads', MB.int); campo('kpis', 'k-ant', 'leads_ant', MB.int); varia('kpis', 'k-var-leads', 'var_leads', false);
campo('kpis', 'k-aprov', 'aprovados', MB.int); campo('kpis', 'k-taxa', 'taxa_aprov', MB.pct); campo('kpis', 'k-opor', 'oportunidades', MB.int); campo('kpis', 'k-expo', 'expositores', MB.int);
campo('custos', 'c-gasto', 'gasto', MB.brl); varia('custos', 'c-var-gasto', 'var_gasto', false); campo('custos', 'c-cpc', 'cpc', MB.brl); campo('custos', 'c-cliques', 'cliques', MB.int); varia('custos', 'c-var-cpc', 'var_cpc', true);
campo('custos', 'c-cpl', 'cpl', MB.brl); campo('custos', 'c-leads', 'leads', MB.int); campo('custos', 'c-cpa', 'custo_aprov', MB.brl); campo('custos', 'c-aprov', 'aprovados', MB.int); campo('custos', 'c-cac', 'cac', MB.brl); campo('custos', 'c-expo', 'expositores', MB.int);

const msgStatus = (d, vazio) => d.status === 'ok' ? vazio : d.status === 'error' ? 'Falhou ao carregar: ' + (d.message || '') : 'Carregando…';
const tabela = (name, src, cols) => dash.draw(name, (tb) => {
  const d = dash.data(src);
  tb.replaceChildren();
  const rows = d.status === 'ok' ? (d.data || []) : [];
  if (!rows.length) { const td = tb.insertRow().insertCell(); td.colSpan = cols.length; td.className = 'muted'; td.style.textAlign = 'left'; td.textContent = msgStatus(d, 'Sem dados no período.'); return; }
  rows.forEach((r) => { const tr = tb.insertRow(); cols.forEach((c) => { const td = tr.insertCell(); c(td, r); }); });
});
const t = (f, k) => (td, r) => { td.textContent = f(r[k]); };
tabela('canais', 'canais', [t(String, 'canal'), t(MB.int, 'leads'), t(MB.int, 'aprovados'), t(MB.pct, 'taxa_aprov'), t(MB.int, 'oportunidades'), t(MB.int, 'expositores'),
  (td, r) => { td.textContent = MB.int(r.parados); if (r.parados > r.leads * .5) td.style.color = 'var(--color-warn)'; }, t(MB.int, 'perdidos')]);
tabela('posicionamentos', 'posicionamentos', [t(String, 'posicionamento'), t(MB.brl, 'gasto'), t(MB.int, 'impressoes'), t(MB.int, 'cliques'), t(MB.pct, 'ctr'), t(MB.brl, 'cpc'), t(MB.int, 'leads'), t(MB.brl, 'cpl'), t(MB.int, 'aprovados'), t(MB.brl, 'custo_aprov')]);
tabela('publicos', 'publicos', [(td, r) => { td.className = 'wrap'; td.append(MB.linkMeta(r.perfil, 'adsets', r.conjunto_id, MB.curto(r.conjunto), r.conjunto)); const s = document.createElement('div'); s.className = 'muted'; s.style.fontSize = 'var(--cds-font-size-caption)'; s.textContent = r.perfil === 'julia' ? 'Julia' : 'Moombox'; td.append(s); }, t(MB.brl, 'gasto'), t(MB.int, 'cliques'), t(MB.brl, 'cpc'), t(MB.int, 'leads'), t(MB.brl, 'cpl'), t(MB.int, 'aprovados'), t(MB.brl, 'custo_aprov'), t(MB.int, 'expositores'), t(MB.brl, 'cac')]);
tabela('anuncios', 'anuncios', [
  MB.celAnuncio,
  t(MB.brl, 'gasto'), t(MB.int, 'cliques'), t(MB.brl, 'cpc'), t(MB.int, 'leads'), t(MB.brl, 'cpl'), t(MB.int, 'aprovados'), t(MB.brl, 'custo_aprov'),
  (td, r) => { td.textContent = MB.int(r.leads_pixel); if (!r.leads_pixel) td.style.color = 'var(--color-warn)'; }]);
tabela('safras', 'safras', [t(MB.mes, 'mes'), t(MB.int, 'leads'), t(MB.pct, 'taxa_aprov'), t(MB.int, 'oportunidades'), t(MB.int, 'expositores'), t(MB.pct, 'taxa_expo')]);
tabela('rastreio', 'rastreio', [
  (td, r) => { td.className = 'wrap'; td.textContent = r.problema; }, t(MB.int, 'leads'),
  (td, r) => { const s = document.createElement('span'); s.className = 'pill ' + (r.leads === 0 ? 'ok' : r.gravidade === 'alto' ? 'bad' : 'warn'); s.textContent = r.leads === 0 ? 'ok' : r.gravidade; td.append(s); }]);
dash.draw('ultimos', (tb) => {
  const d = dash.data('base');
  tb.replaceChildren();
  const rows = d.status === 'ok' && d.data ? d.data.slice(0, 30) : [];
  if (!rows.length) { const td = tb.insertRow().insertCell(); td.colSpan = 5; td.className = 'muted'; td.textContent = msgStatus(d, 'Sem leads no período.'); return; }
  rows.forEach((r) => { const tr = tb.insertRow();
    const a = tr.insertCell(); a.className = 'wrap'; a.textContent = r.marca || '(sem nome)';
    tr.insertCell().textContent = MB.dm(r.dia); tr.insertCell().textContent = r.origem || '—'; tr.insertCell().textContent = r.status || '—';
    const u = tr.insertCell(); u.className = 'wrap muted'; u.textContent = r.utm_campaign ? r.utm_campaign.slice(0, 48) : '—'; });
});

document.querySelectorAll('#lg-leads').forEach((e) => { e.style.background = dash.colors[0]; });
document.querySelectorAll('#lg-gasto').forEach((e) => { e.style.background = dash.colors[1]; });
dash.draw('diario', (el) => {
  const d = dash.data('diario');
  el.replaceChildren();
  if (d.status !== 'ok' || !d.data) { const p = document.createElement('p'); p.className = 'muted'; p.textContent = msgStatus(d, ''); el.append(p); return; }
  const rows = d.data, W = Math.max(300, el.clientWidth), H = 240, m = {t: 10, r: 46, b: 26, l: 34};
  const x = d3.scaleBand().domain(rows.map((r) => r.dia)).range([m.l, W - m.r]).padding(.2);
  const yL = d3.scaleLinear().domain([0, d3.max(rows, (r) => r.leads) || 1]).nice().range([H - m.b, m.t]);
  const yG = d3.scaleLinear().domain([0, d3.max(rows, (r) => r.gasto) || 1]).nice().range([H - m.b, m.t]);
  const svg = d3.select(el).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img')
    .attr('aria-label', 'Leads por dia em barras e gasto diário em linha, no período escolhido');
  svg.append('g').selectAll('line').data(yL.ticks(4)).join('line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', yL).attr('y2', yL).style('stroke', 'var(--cds-chart-grid)');
  const every = Math.max(1, Math.ceil(rows.length / (W < 500 ? 5 : 9)));
  svg.append('g').attr('class', 'axis').attr('transform', `translate(0,${H - m.b})`).call(d3.axisBottom(x).tickValues(rows.filter((r, i) => i % every === 0).map((r) => r.dia)).tickFormat(MB.dm).tickSizeOuter(0));
  svg.append('g').attr('class', 'axis').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(yL).ticks(4).tickSize(0)).call((g) => g.select('.domain').remove());
  svg.append('g').attr('class', 'axis').attr('transform', `translate(${W - m.r},0)`).call(d3.axisRight(yG).ticks(4).tickSize(0).tickFormat((v) => 'R$' + v)).call((g) => g.select('.domain').remove());
  svg.append('g').selectAll('rect').data(rows).join('rect').attr('x', (r) => x(r.dia)).attr('width', x.bandwidth()).attr('y', (r) => yL(r.leads)).attr('height', (r) => yL(0) - yL(r.leads)).attr('rx', 2).style('fill', dash.colors[0]);
  svg.append('path').datum(rows).attr('d', d3.line().x((r) => x(r.dia) + x.bandwidth() / 2).y((r) => yG(r.gasto))).style('fill', 'none').style('stroke', dash.colors[1]).style('stroke-width', 2);
  const tip = document.createElement('div'); tip.className = 'tip'; tip.hidden = true; el.append(tip);
  svg.append('g').selectAll('rect').data(rows).join('rect').attr('x', (r) => x(r.dia) - x.step() * x.padding() / 2).attr('width', x.step()).attr('y', m.t).attr('height', H - m.t - m.b).style('fill', 'transparent')
    .on('pointerenter pointermove', (ev, r) => { tip.hidden = false; tip.textContent = `${MB.dm(r.dia)} · ${r.leads} leads · ${MB.brl(r.gasto)} gasto em anúncios`;
      const b = el.getBoundingClientRect(); let lx = ev.clientX - b.left + 10; if (lx > b.width - 200) lx = Math.max(0, lx - 220); tip.style.left = lx + 'px'; tip.style.top = (ev.clientY - b.top - 30) + 'px'; })
    .on('pointerleave', () => { tip.hidden = true; });
});

campo('conta', 's-rest', 'restante', MB.brl); campo('conta', 's-orc', 'orcamento_dia', MB.brl);
campo('conta', 's-dias', 'dias_saldo', (v) => v == null ? '—' : v.toLocaleString('pt-BR', {maximumFractionDigits: 1}));
campo('conta', 's-ritmo', 'ritmo', MB.pct);
const dec = (v) => v == null || !isFinite(v) ? '—' : v.toLocaleString('pt-BR', {maximumFractionDigits: 2});
tabela('sugestoes', 'sugestoes', [(td, r) => { const s = document.createElement('span'); s.className = 'pill ' + (r.tipo === 'OK' ? 'ok' : r.tipo === 'Saldo' || r.tipo === 'Rastreio' ? 'bad' : 'warn'); s.textContent = r.tipo; td.append(s); }, (td, r) => { td.className = 'wrap'; td.textContent = r.texto; }]);
tabela('funil_midia', 'funil_midia', [t(String, 'etapa'), t(MB.int, 'valor'), t(MB.pct, 'pct'), t(MB.brl, 'custo')]);
tabela('criativos', 'criativos', [
  MB.celAnuncio,
  (td, r) => { td.textContent = MB.brl(r.gasto); td.style.fontWeight = '600'; }, t(MB.int, 'impressoes'), (td, r) => { td.textContent = dec(r.freq); if (r.freq > 2.5) td.style.color = 'var(--color-warn)'; }, t(MB.brl, 'cpm'), t(MB.pct, 'ctr'),
  (td, r) => { td.textContent = MB.pct(r.gancho); if (r.gancho != null && r.gancho < 0.25) td.style.color = 'var(--color-warn)'; }, t(MB.pct, 'p25'), t(MB.pct, 'p50'), t(MB.pct, 'p75'), t(MB.pct, 'p100'), t(MB.pct, 'thruplay'),
  (td, r) => { td.textContent = MB.pct(r.chegada); if (r.chegada != null && r.chegada < 0.6) td.style.color = 'var(--color-bad)'; }, t(MB.brl, 'custo_visita')]);
const linhaGrupo = () => [(td, r) => { td.textContent = String(r.grupo).replace(/^[0-9] /, ''); }, t(MB.brl, 'gasto'), t(MB.pct, 'pct_gasto'), t(MB.int, 'cliques'),
  (td, r) => { td.textContent = MB.pct(r.pct_cliques); if (r.pct_gasto && r.pct_cliques != null && r.pct_gasto - r.pct_cliques > 0.1) td.style.color = 'var(--color-bad)'; }, t(MB.pct, 'ctr'), t(MB.brl, 'cpc')];
tabela('campanhas', 'campanhas', [(td, r) => { td.className = 'wrap'; if (r.campanha_ids) { td.append(MB.linkMeta(r.perfil, 'campaigns', r.campanha_ids, r.campanha, r.campanha)); const s = document.createElement('div'); s.className = 'muted'; s.style.fontSize = 'var(--cds-font-size-caption)'; s.textContent = r.perfil === 'julia' ? 'Julia' : 'Moombox'; td.append(s); } else td.textContent = r.campanha; }, t(MB.int, 'leads'), t(MB.int, 'aprovados'), t(MB.pct, 'taxa_aprov'), t(MB.int, 'oportunidades'),
  (td, r) => { td.textContent = MB.int(r.expositores); if (r.expositores) td.style.fontWeight = '600'; }, t(MB.pct, 'taxa_expo'), t(MB.brl, 'gasto'), t(MB.brl, 'cpc'), t(MB.brl, 'custo_aprov'), t(MB.brl, 'cac')]);
const COMP = [['gasto', MB.brl, 0], ['cpm', MB.brl, -1], ['ctr', MB.pct, 1], ['gancho', MB.pct, 1], ['video_medio', (v) => v == null ? '—' : v.toLocaleString('pt-BR', {maximumFractionDigits: 1}) + ' s', 1], ['freq', dec, 0], ['leads_meta', MB.int, 1], ['cpl', MB.brl, -1], ['taxa_aprov', MB.pct, 1], ['custo_aprov_est', MB.brl, -1], ['expos_camp', MB.int, 0], ['custo_expo_est', MB.brl, -1], ['cac_camp', MB.brl, -1]];
dash.draw('comparativo', (tb) => {
  const d = dash.data('comparativo');
  tb.replaceChildren();
  const rows = d.status === 'ok' && d.data ? d.data : [];
  if (!rows.length) { const td = tb.insertRow().insertCell(); td.colSpan = 17; td.className = 'muted'; td.style.textAlign = 'left'; td.textContent = msgStatus(d, 'Nenhum anúncio da Moombox com gasto no período.'); return; }
  const base = rows.filter((r) => r.gasto >= 50), ext = {};
  COMP.forEach(([k, , dir]) => { if (!dir) return; const v = base.map((r) => r[k]).filter((x) => x != null && isFinite(x)); if (v.length > 1) ext[k] = [d3.min(v), d3.max(v)]; });
  rows.forEach((r) => { const tr = tb.insertRow();
    MB.celAnuncio(tr.insertCell(), r);
    const s = tr.insertCell(); const p = document.createElement('span'); p.className = 'pill ' + (r.status === 'Ativo' ? 'ok' : ''); p.textContent = r.status; s.append(p);
    const de = tr.insertCell(); de.className = 'wrap'; de.style.minWidth = '110px'; de.textContent = r.destino;
    COMP.forEach(([k, f, dir]) => { const td = tr.insertCell(); td.textContent = f(r[k]);
      if (dir && ext[k] && r.gasto >= 50 && r[k] != null && ext[k][0] !== ext[k][1]) { const best = dir > 0 ? ext[k][1] : ext[k][0], worst = dir > 0 ? ext[k][0] : ext[k][1]; if (r[k] === best) td.className = 'best'; else if (r[k] === worst) td.className = 'worst'; } });
    tr.insertCell().textContent = r.melhor_posicao || '—'; });
});
dash.draw('fichas', (el) => {
  const d = dash.data('comparativo');
  el.replaceChildren();
  const rows = d.status === 'ok' && d.data ? d.data : [];
  if (!rows.length) { const p = document.createElement('p'); p.className = 'muted'; p.textContent = msgStatus(d, 'Sem anúncios no período.'); el.append(p); return; }
  rows.forEach((r) => {
    const card = document.createElement('div'); card.className = 'ficha'; card.id = 'ficha-' + r.chave;
    const h = document.createElement('h3'); h.append(MB.linkMeta('moombox', 'ads', r.chave, MB.curto(r.anuncio), r.anuncio)); card.append(h);
    const m = document.createElement('div'); m.className = 'meta'; m.textContent = r.status + ' · ' + r.destino + ' · criado em ' + MB.dm(r.criado) + '/' + String(r.criado).slice(2, 4) + ' · ';
    if (r.post) { const a = document.createElement('a'); a.href = r.post; a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'ver post ↗'; a.style.color = 'inherit'; m.append(a); }
    card.append(m);
    const nums = document.createElement('div'); nums.className = 'nums';
    [['Investido', 'gasto', MB.brl], ['CPL Meta', 'cpl', MB.brl], ['Custo/aprov. est.', 'custo_aprov_est', MB.brl], ['Custo/expos. est.', 'custo_expo_est', MB.brl], ['Custo/expos. campanha', 'cac_camp', MB.brl], ['Gancho 3s', 'gancho', MB.pct]].forEach(([l, k, f]) => {
      const s = document.createElement('span'); s.append(l + ' '); const b = document.createElement('b'); b.textContent = f(r[k]); s.append(b); nums.append(s); });
    card.append(nums);
    const dl = document.createElement('dl');
    [['Idade', r.idade], ['Local', r.local], ['Interesses', r.interesses], ['Cargos', r.cargos], ['Comportamento', r.comportamentos], ['Públicos incluídos', r.incluidos], ['Públicos excluídos', r.excluidos], ['Advantage+ público', r.advantage], ['Plataformas', r.plataformas], ['Otimiza para', r.otimizacao], ['Conjunto', MB.curto(r.conjunto)]]
      .filter(([, v]) => v).forEach(([k, v]) => { const dt = document.createElement('dt'); dt.textContent = k; const dd = document.createElement('dd'); dd.textContent = v; dl.append(dt, dd); });
    card.append(dl); el.append(card);
  });
});
tabela('idades', 'idades', linhaGrupo()); tabela('aparelhos', 'aparelhos', linhaGrupo()); tabela('horarios', 'horarios', linhaGrupo());

const listaExpo = (src, name) => dash.draw(name, (el) => {
  const k = dash.data(src), l = (k.status === 'ok' && k.data && k.data[0] && k.data[0].expo_lista) || [];
  el.replaceChildren();
  const card = el.closest('.kpi');
  if (card) card.title = l.length ? l.map((r) => r.marca).join('\n') : '';
  const det = el.closest('details'); if (det) det.style.display = l.length ? '' : 'none';
  l.slice().sort((a, b) => d3.descending(a.dia, b.dia)).forEach((r) => {
    const li = document.createElement('div'); li.className = 'expo-item';
    const b = document.createElement('b'); b.textContent = r.marca || '(sem nome)';
    const m = document.createElement('span'); m.className = 'muted'; m.textContent = ' · entrou ' + MB.dm(r.dia) + ' · ' + r.canal + (/inadimpl/i.test(r.status) ? ' · inadimplente' : '');
    li.append(b, m); el.append(li);
  });
});
listaExpo('kpis', 'k-expo-lista'); listaExpo('custos', 'c-expo-lista'); listaExpo('fechadas', 'f-lista');
campo('fechadas', 'f-n', 'fechadas', MB.int); campo('fechadas', 'f-total', 'fechadas_total', MB.int); campo('fechadas', 'f-custo', 'custo', MB.brl); campo('fechadas', 'f-mensal', 'mensal', MB.brl);
dash.draw('f-lojas', (el) => { const k = dash.data('fechadas'); el.textContent = (k.status === 'ok' && k.data[0] && k.data[0].lojas) || '—'; });
dash.draw('f-outras', (el) => { const k = dash.data('fechadas'), l = (k.status === 'ok' && k.data[0] && k.data[0].outras_lista) || []; el.textContent = l.length ? 'Outras origens: ' + l.map((r) => r.marca + ' (' + r.canal + ')').join(', ') : ''; });
