document.querySelectorAll('.mb-per').forEach((b) => b.addEventListener('click', () => dash.setParams({periodo: b.dataset.v, de: '', ate: ''})));
document.querySelectorAll('.mb-atrib').forEach((b) => b.addEventListener('click', () => dash.setParams({atrib: b.dataset.v})));
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
  document.querySelectorAll('.mb-atrib').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === (p.atrib === 'equipe' ? 'equipe' : 'anuncio'))));
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
campo('custos', 'c-cpl', 'cpl', MB.brl); campo('custos', 'c-leads', 'leads', MB.int); campo('custos', 'c-cpa', 'custo_aprov', MB.brl); campo('custos', 'c-aprov', 'aprovados', MB.int); campo('custos', 'c-cac', 'cac', MB.brl); campo('custos', 'c-cop', 'custo_opor', MB.brl); campo('custos', 'c-opor', 'oportunidades', MB.int); campo('custos', 'c-expo', 'expositores', MB.int);

const msgStatus = (d, vazio) => d.status === 'ok' ? vazio : d.status === 'error' ? 'Falhou ao carregar: ' + (d.message || '') : 'Carregando…';
const tabela = (name, src, cols) => dash.draw(name, (tb) => {
  const d = dash.data(src);
  tb.replaceChildren();
  const rows = d.status === 'ok' ? (d.data || []) : [];
  if (!rows.length) { const td = tb.insertRow().insertCell(); td.colSpan = cols.length; td.className = 'muted'; td.style.textAlign = 'left'; td.textContent = msgStatus(d, 'Sem dados no período.'); return; }
  const fx = document.getElementById('fx-' + name), lst = fx && fx.checked ? rows.filter((r) => r.gasto > 0) : rows;
  lst.forEach((r) => { const tr = tb.insertRow(); cols.forEach((c) => { const td = tr.insertCell(); c(td, r); }); });
  if (TOTAIS[name] && lst.length) { const tr = tb.insertRow(); tr.className = 'linha-total'; const r = TOTAIS[name](lst); cols.forEach((c, i) => { const td = tr.insertCell(); if (i === 0) td.textContent = r._rotulo; else c(td, r); }); }
});
const TOTAIS = {
  reprovados: (l) => { const s = (k) => d3.sum(l, (r) => r[k] || 0), le = s('leads'), rp = s('reprovados'); return {_rotulo: 'Total', campanha: '', leads: le, reprovados: rp, taxa_reprov: le ? rp / le : null, fat_baixo: rp ? d3.sum(l, (r) => (r.fat_baixo || 0) * r.reprovados) / rp : null, fat_resumo: '', aprovados: s('aprovados'), nao_interessados: s('nao_interessados')}; },
  campanhas: (l) => { const s = (k) => d3.sum(l, (r) => r[k] || 0), g = s('gasto'), le = s('leads'), ap = s('aprovados'), ex = s('expositores'), cl = d3.sum(l, (r) => r.gasto && r.cpc ? r.gasto / r.cpc : 0);
    return {_rotulo: 'Total · ' + l.length + ' campanha' + (l.length > 1 ? 's' : ''), leads: le, aprovados: ap, taxa_aprov: le ? ap / le : null, oportunidades: s('oportunidades'), expositores: ex, taxa_expo: le ? ex / le : null, gasto: g, cpc: cl ? g / cl : null, cpl: (() => { const lp = d3.sum(l, (r) => r.gasto > 0 ? r.leads || 0 : 0); return lp ? g / lp : null; })(), custo_aprov: ap ? g / ap : null, cac: ex ? g / ex : null}; }
};
document.querySelectorAll('.fx').forEach((el) => el.addEventListener('change', () => dash.setParams({})));
dash.draw('confere-campanhas', (el) => {
  const a = dash.data('campanhas'), c = dash.data('custos');
  if (a.status !== 'ok' || c.status !== 'ok' || !c.data[0]) { el.textContent = ''; return; }
  const soma = d3.sum(a.data, (r) => r.gasto || 0), tot = c.data[0].gasto || 0, dif = Math.abs(soma - tot);
  el.textContent = 'Conferência: soma da tabela ' + MB.brl(soma) + ' · investido nas contas ' + MB.brl(tot) + (dif < 1 ? ' ✓ bate' : ' · diferença ' + MB.brl(soma - tot));
  el.style.color = dif < 1 ? '' : 'var(--color-warn)';
});
const t = (f, k) => (td, r) => { td.textContent = f(r[k]); };
tabela('canais', 'canais', [(td, r) => { td.textContent = r.canal; if (r.origens) { td.title = 'Origens no Airtable:\n' + r.origens; td.style.cursor = 'help'; td.style.textDecoration = 'underline dotted'; } }, t(MB.int, 'leads'), t(MB.int, 'aprovados'), t(MB.pct, 'taxa_aprov'), t(MB.int, 'oportunidades'), (td, r) => { td.textContent = MB.int(r.expositores); if (r.expo_marcas) { td.title = r.expo_marcas; td.style.cursor = 'help'; td.style.textDecoration = 'underline dotted'; } },
  (td, r) => { td.textContent = MB.int(r.parados); if (r.parados > r.leads * .5) td.style.color = 'var(--color-warn)'; }, t(MB.int, 'perdidos')]);
tabela('reprovados', 'reprovados', [t(String, 'canal'), (td, r) => { td.className = 'wrap'; td.textContent = r.campanha || '—'; if (r.anuncio && r.anuncio !== r.campanha) { const s = document.createElement('div'); s.className = 'muted'; s.style.fontSize = 'var(--cds-font-size-caption)'; s.textContent = r.anuncio; td.append(s); } },
  t(MB.int, 'leads'), (td, r) => { td.textContent = MB.int(r.reprovados); if (r.marcas) { td.title = r.marcas; td.style.cursor = 'help'; td.style.textDecoration = 'underline dotted'; } },
  (td, r) => { td.textContent = MB.pct(r.taxa_reprov); if (r.taxa_reprov >= .3 && r.leads >= 5) td.style.color = 'var(--color-warn)'; }, t(MB.pct, 'fat_baixo'), (td, r) => { td.className = 'wrap'; td.textContent = r.fat_resumo || '—'; }, t(MB.int, 'aprovados'), t(MB.int, 'nao_interessados')]);
tabela('posicionamentos', 'posicionamentos', [t(String, 'posicionamento'), t(MB.brl, 'gasto'), t(MB.int, 'impressoes'), t(MB.int, 'cliques'), t(MB.pct, 'ctr'), t(MB.brl, 'cpc'), t(MB.int, 'leads'), t(MB.brl, 'cpl'), t(MB.int, 'aprovados'), t(MB.brl, 'custo_aprov')]);
tabela('publicos', 'publicos', [(td, r) => { td.className = 'wrap'; td.append(MB.linkMeta(r.perfil, 'adsets', r.conjunto_id, MB.curto(r.conjunto), r.conjunto)); const s = document.createElement('div'); s.className = 'muted'; s.style.fontSize = 'var(--cds-font-size-caption)'; s.textContent = r.perfil === 'julia' ? 'Julia' : 'Moombox'; td.append(s); }, t(MB.brl, 'gasto'), t(MB.int, 'cliques'), t(MB.brl, 'cpc'), t(MB.int, 'leads'), t(MB.brl, 'cpl'), t(MB.int, 'aprovados'), t(MB.brl, 'custo_aprov'), t(MB.int, 'expositores'), t(MB.brl, 'cac')]);
tabela('anuncios', 'anuncios', [
  MB.celAnuncio,
  t(MB.brl, 'gasto'), t(MB.int, 'cliques'), t(MB.brl, 'cpc'), t(MB.int, 'leads'), t(MB.brl, 'cpl'), t(MB.int, 'aprovados'), t(MB.brl, 'custo_aprov'), (td, r) => { td.textContent = MB.int(r.expositores); if (r.expositores) td.style.fontWeight = '600'; }, t(MB.brl, 'cac'),
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
  if (x.bandwidth() >= 34) svg.append('g').selectAll('text').data(rows.filter((r) => r.gasto > 0)).join('text').attr('x', (r) => x(r.dia) + x.bandwidth() / 2).attr('y', (r) => Math.max(m.t + 9, yL(r.leads) - 4)).attr('text-anchor', 'middle')
    .style('font-size', '10px').style('fill', 'var(--color-fg-muted)').text((r) => r.leads_pago ? MB.brl(r.gasto / r.leads_pago).replace(',00', '') : 'sem lead');
  const tip = document.createElement('div'); tip.className = 'tip'; tip.hidden = true; el.append(tip);
  svg.append('g').selectAll('rect').data(rows).join('rect').attr('x', (r) => x(r.dia) - x.step() * x.padding() / 2).attr('width', x.step()).attr('y', m.t).attr('height', H - m.t - m.b).style('fill', 'transparent')
    .on('pointerenter pointermove', (ev, r) => { tip.hidden = false; tip.textContent = `${MB.dm(r.dia)} · ${r.leads} leads (${r.leads_pago} de anúncio) · ${MB.brl(r.gasto)} gasto · custo por lead de anúncio ${r.leads_pago ? MB.brl(r.gasto / r.leads_pago) : '—'}`;
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
  (td, r) => { td.textContent = MB.pct(r.chegada); if (r.chegada != null && r.chegada < 0.6) td.style.color = 'var(--color-bad)'; }, t(MB.brl, 'custo_visita'),
  (td, r) => { td.textContent = MB.int(r.leads); if (r.leads_meta > r.leads) { const m = document.createElement('div'); m.className = 'muted'; m.style.fontSize = 'var(--cds-font-size-caption)'; m.textContent = 'Meta: ' + MB.int(r.leads_meta); m.title = 'Leads do formulário Meta chegam ao Airtable sem o anúncio; por isso o Airtable mostra menos.'; td.append(m); } },
  t(MB.int, 'aprovados'), (td, r) => { td.textContent = MB.int(r.expositores); if (r.expositores) td.style.fontWeight = '600'; }, t(MB.brl, 'custo_aprov')]);
const linhaGrupo = () => [(td, r) => { td.textContent = String(r.grupo).replace(/^[0-9] /, ''); }, t(MB.brl, 'gasto'), t(MB.pct, 'pct_gasto'), t(MB.int, 'cliques'),
  (td, r) => { td.textContent = MB.pct(r.pct_cliques); if (r.pct_gasto && r.pct_cliques != null && r.pct_gasto - r.pct_cliques > 0.1) td.style.color = 'var(--color-bad)'; }, t(MB.pct, 'ctr'), t(MB.brl, 'cpc')];
tabela('campanhas', 'campanhas', [(td, r) => { td.className = 'wrap'; if (r.campanha_ids) { td.append(MB.linkMeta(r.perfil, 'campaigns', r.campanha_ids, r.campanha, r.campanha)); const s = document.createElement('div'); s.className = 'muted'; s.style.fontSize = 'var(--cds-font-size-caption)'; s.textContent = r.perfil === 'julia' ? 'Julia' : 'Moombox'; td.append(s); } else td.textContent = r.campanha; }, t(MB.int, 'leads'), t(MB.int, 'aprovados'), t(MB.pct, 'taxa_aprov'), t(MB.int, 'oportunidades'),
  (td, r) => { td.textContent = MB.int(r.expositores); if (r.expositores) td.style.fontWeight = '600'; }, t(MB.pct, 'taxa_expo'), t(MB.brl, 'gasto'), t(MB.brl, 'cpc'), (td, r) => { td.textContent = MB.brl(r.cpl !== undefined ? r.cpl : (r.gasto > 0 && r.leads ? r.gasto / r.leads : null)); }, t(MB.brl, 'custo_aprov'), t(MB.brl, 'cac')]);
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
    const ca = ext.custo_aprov_est; if (ca && r.gasto >= 50 && r.custo_aprov_est != null && ca[0] !== ca[1]) { if (r.custo_aprov_est === ca[0]) tr.classList.add('linha-best'); else if (r.custo_aprov_est === ca[1]) tr.classList.add('linha-worst'); }
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

const fmtD = (v) => v == null ? '—' : Math.round(v) + (Math.round(v) === 1 ? ' dia' : ' dias');
dash.draw('ciclo', (el) => {
  const k = dash.data('fechadas'), r = k.status === 'ok' && k.data[0];
  el.replaceChildren();
  if (!r) { el.textContent = k.status === 'error' ? k.message : 'Carregando…'; return; }
  const top = document.createElement('div'); top.className = 'ciclo-top';
  [['Tempo médio até fechar', fmtD(r.dias_medio)], ['Mediana', fmtD(r.dias_mediana)], ['Mais rápida / mais lenta', r.dias_min == null ? '—' : r.dias_min + ' / ' + r.dias_max + ' dias'], ['Novas leads fechadas', MB.int(r.novas) + (r.antigas ? ' (+' + r.antigas + ' leads antigos fora da conta)' : '')]].forEach(([l, v]) => {
    const b = document.createElement('div'); b.className = 'kpi'; const a = document.createElement('span'); a.className = 'lbl'; a.textContent = l; const c = document.createElement('span'); c.className = 'val'; c.textContent = v; b.append(a, c); top.append(b); });
  el.append(top);
  if (!r.ciclo.length) { const p = document.createElement('p'); p.className = 'muted'; p.textContent = 'Nenhuma lead nova fechou no período.'; el.append(p); return; }
  const mx = Math.max(...r.ciclo.map((x) => x.dias), 1), lista = document.createElement('div'); lista.className = 'ciclo-lista';
  r.ciclo.forEach((x) => {
    const row = document.createElement('div'); row.className = 'ciclo-row';
    const n = document.createElement('div'); n.className = 'ciclo-nome'; n.textContent = x.marca; const sub = document.createElement('div'); sub.className = 'muted'; sub.textContent = MB.dm(x.entrou) + ' → ' + MB.dm(x.fechou) + ' · ' + x.canal + (x.loja ? ' · ' + x.loja : ''); n.append(sub);
    const bw = document.createElement('div'); bw.className = 'ciclo-barw'; const bar = document.createElement('div'); bar.className = 'ciclo-bar' + (x.dias <= 7 ? ' rap' : x.dias > 30 ? ' len' : ''); bar.style.width = Math.max(4, x.dias / mx * 100) + '%'; bw.append(bar);
    const d = document.createElement('div'); d.className = 'ciclo-d'; d.textContent = fmtD(x.dias);
    row.append(n, bw, d); lista.append(row); });
  el.append(lista);
});

['n', 'proposta', 'oportunidade', 'aprovada', 'entrada', 'perdidas'].forEach((k) => campo('travadas', 'tr-' + k, k, MB.int));
campo('travadas', 'tr-taxa', 'taxa_perda', MB.pct);
dash.draw('tr-motivos', (el) => { const k = dash.data('travadas'); el.textContent = (k.status === 'ok' && k.data[0] && k.data[0].motivos) || '—'; });
dash.draw('travadas', (tb) => {
  const k = dash.data('travadas'), l = (k.status === 'ok' && k.data[0] && k.data[0].lista) || [];
  tb.replaceChildren();
  if (!l.length) { const td = tb.insertRow().insertCell(); td.colSpan = 7; td.className = 'muted'; td.textContent = k.status === 'ok' ? 'Nenhuma lead parada no período. 👏' : msgStatus(k, ''); return; }
  l.slice(0, 80).forEach((r) => { const tr = tb.insertRow();
    const a = tr.insertCell(); a.className = 'wrap'; const lk = document.createElement('a'); lk.href = 'https://airtable.com/appJ6JOQgEdIDNnVJ/tblm3WZMjzes3aM5S/' + r.id; lk.target = '_blank'; lk.rel = 'noopener'; lk.textContent = r.marca + ' ↗'; lk.style.color = 'inherit'; a.append(lk);
    tr.insertCell().textContent = r.status; const d = tr.insertCell(); d.textContent = r.parada + ' dias'; d.style.fontWeight = '600'; if (r.parada > 14) d.style.color = 'var(--color-warn)';
    tr.insertCell().textContent = MB.dm(r.entrou); tr.insertCell().textContent = r.canal; tr.insertCell().textContent = r.loja || '—'; tr.insertCell().textContent = r.resp || '—'; });
  if (l.length > 80) { const td = tb.insertRow().insertCell(); td.colSpan = 7; td.className = 'muted'; td.textContent = '+ ' + (l.length - 80) + ' leads paradas não mostradas.'; }
});
dash.draw('f-regra', (el) => { el.textContent = dash.params().atrib === 'equipe' ? 'todas com origem Meta, LP ou WhatsApp (inclui WhatsApp orgânico — mesma regra da visão Purchase do Airtable)' : 'só leads que vieram de anúncio (formulário Meta, LP, WhatsApp de anúncio, UTM ou fbclid)'; });

// Período do filtro ao lado do título de cada painel (para não precisar voltar ao topo para ver o que está selecionado).
(() => {
  const SEM = /^(Saldo e ritmo de gasto|Ficha de cada anúncio)/; // painéis que não seguem o filtro de período
  dash.onData(() => {
    const j = dash.data('janela'), r = j.status === 'ok' && j.data && j.data[0];
    if (!r) return;
    const pf = dash.params().perfil || 'todos';
    const txt = (r.dias === 1 ? MB.dm(r.de) : MB.dm(r.de) + ' a ' + MB.dm(r.ate)) + (pf === 'todos' ? '' : ' · ' + (pf === 'julia' ? 'Julia' : 'Moombox'));
    document.querySelectorAll('.mb h2').forEach((h) => {
      if (SEM.test(h.textContent)) return;
      let c = h.querySelector('.per-chip');
      if (!c) { c = document.createElement('span'); c.className = 'per-chip'; h.append(c); }
      c.textContent = txt;
      c.title = 'Período do filtro: ' + (r.dias === 1 ? MB.dm(r.de) : MB.dm(r.de) + ' a ' + MB.dm(r.ate) + ' (' + r.dias + ' dias)');
    });
  });
})();

dash.draw('diario-resumo', (el) => {
  const d = dash.data('diario'); if (d.status !== 'ok' || !d.data) { el.textContent = ''; return; }
  const rows = d.data, g = d3.sum(rows, (r) => r.gasto), lp = d3.sum(rows, (r) => r.leads_pago), lt = d3.sum(rows, (r) => r.leads);
  const dias = rows.filter((r) => r.gasto > 0), n = dias.length;
  let corr = '';
  if (n >= 7) {
    const mx = d3.mean(dias, (r) => r.gasto), my = d3.mean(dias, (r) => r.leads_pago);
    const sxy = d3.sum(dias, (r) => (r.gasto - mx) * (r.leads_pago - my)), sx = Math.sqrt(d3.sum(dias, (r) => (r.gasto - mx) ** 2)), sy = Math.sqrt(d3.sum(dias, (r) => (r.leads_pago - my) ** 2));
    const rr = sx && sy ? sxy / (sx * sy) : null;
    if (rr != null) { const f = Math.abs(rr) >= .7 ? 'forte' : Math.abs(rr) >= .4 ? 'moderada' : 'fraca'; corr = ` · Correlação gasto × leads de anúncio, dia a dia: <b>${rr.toLocaleString('pt-BR', {maximumFractionDigits: 2})}</b> (${f}${rr < 0 ? ', negativa' : ''})`; }
  } else corr = ' · Correlação: escolha 7 dias ou mais';
  el.innerHTML = `Custo por lead de anúncio no período: <b>${lp ? MB.brl(g / lp) : '—'}</b> (${MB.brl(g)} ÷ ${MB.int(lp)} leads de anúncio; ${MB.int(lt)} leads no total)` + corr;
});
