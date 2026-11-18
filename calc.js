dash.loader('leads', {
  description: 'Junta as páginas da resposta do Airtable e transforma cada registro em uma linha.',
  fn: async ({answer, call, args}) => {
    if (answer && answer.error) throw new Error(answer.error.message || String(answer.error));
    const pages = [answer]; let a = answer, n = 0;
    while (a && a.nextCursor && n < 8) { a = await call('list_records_for_table', Object.assign({}, args, {cursor: a.nextCursor})); pages.push(a); n++; }
    const F = {marca:'fldGmvhtiErEDHSeo', status:'fldFhpivgeWlIub5l', origem:'fldt8Pj7VHxWbbgDm', dia:'fldEdfZ5bPcKBGBHW', utm_campaign:'fldUJ54qkweyo7OPs', utm_medium:'fld1SSKpuN5VrcImt', utm_content:'fldyMup9Yv7HAQaSZ', obs:'fld9NMnockPfCJZpC', fbclid:'fldkoenYwt0J9R1OL', qualificado:'fldaXA9qR2IBmRMjx', compra:'fldiBu74XwR7prwPh', loja:'fldsbPhELYcSRBLM2', mensal:'fldoUvnydMjJgmdzk', mudou:'fldwoqgb4B9XpFN1g', resp:'fldZq7UOcqcoZlOoQ', fat:'fldolNklr091unulM'};
    const rows = [];
    for (const p of pages) for (const r of ((p && p.records) || [])) {
      const c = r.cellValuesByFieldId || {};
      rows.push({id: r.id, dia: c[F.dia] || '', marca: String(c[F.marca] || '').trim(), status: String((c[F.status] && c[F.status].name) || '').trim(),
        origem: String(c[F.origem] || '').trim(), utm_campaign: String(c[F.utm_campaign] || ''), utm_medium: String(c[F.utm_medium] || ''), utm_content: String(c[F.utm_content] || ''),
        observacoes: String(c[F.obs] || ''), tem_fbclid: c[F.fbclid] ? 'sim' : 'não', qualificado_em: c[F.qualificado] || '', criado_em: r.createdTime, compra: String(c[F.compra] || '').slice(0, 10), loja: String((c[F.loja] && c[F.loja].name) || c[F.loja] || ''), mensalidade: +c[F.mensal] || 0, mudou: String(c[F.mudou] || '').slice(0, 10), resp: (Array.isArray(c[F.resp]) ? c[F.resp] : []).map((u) => (u && (u.name || u.email)) || '').filter(Boolean).join(', '), faturamento: String((c[F.fat] && c[F.fat].name) || c[F.fat] || '')});
    }
    return {rows, columns: ['id','dia','marca','status','origem','utm_campaign','utm_medium','utm_content','observacoes','tem_fbclid','qualificado_em','criado_em','compra','loja','mensalidade','mudou','resp','faturamento'], truncated: !!(a && a.nextCursor)};
  }
});
const windsorLoader = (cols, map) => async ({answer, call, args}) => {
  let a = answer, n = 0;
  while (a && a.status === 'pending' && n < 10) { a = await call('get_data', args, {poll: true}); n++; }
  if (a && a.status === 'pending') throw new Error('O Windsor ainda está gerando o relatório. Tente atualizar em alguns minutos.');
  if (a && a.error) throw new Error(a.error.message || String(a.error));
  return {rows: ((a && a.data) || []).map((r) => Object.assign(map(r), {perfil: String(r.account_id) === '971157280803730' ? 'julia' : 'moombox'})), columns: cols.concat(['perfil'])};
};
window.PF = (rows) => { const p = dash.params().perfil || 'todos'; return p === 'todos' ? rows : rows.filter((r) => r.perfil === p); };
window.PAGO = (r, pf) => r.pago && (pf === 'todos' || r.perfil === pf);
dash.loader('meta_ads', {
  description: 'Uma linha por dia e anúncio.',
  fn: windsorLoader(['data','campanha','campanha_id','conjunto','conjunto_id','anuncio','ad_id','gasto','impressoes','cliques','leads_pixel','leads_meta'], (r) => ({data: r.date, campanha: r.campaign, campanha_id: String(r.campaign_id || ''), conjunto: r.adset_name, conjunto_id: String(r.adset_id || ''), anuncio: r.ad_name, ad_id: String(r.ad_id),
    gasto: +r.spend || 0, impressoes: +r.impressions || 0, cliques: +r.link_clicks || 0, leads_pixel: +r.actions_offsite_conversion_fb_pixel_lead || 0, leads_meta: +r.actions_lead || 0}))
});
dash.loader('meta_plac', {
  description: 'Uma linha por dia, anúncio e posicionamento.',
  fn: windsorLoader(['data','conjunto','ad_id','plataforma','posicao','gasto','impressoes','cliques'], (r) => ({data: r.date, conjunto: r.adset_name, ad_id: String(r.ad_id), plataforma: r.publisher_platform, posicao: r.platform_position,
    gasto: +r.spend || 0, impressoes: +r.impressions || 0, cliques: +r.link_clicks || 0}))
});

const num = (v) => +v || 0;
dash.loader('meta_criativo', {
  description: 'Uma linha por dia e anúncio com alcance, vídeo, visitas e orçamento.',
  fn: windsorLoader(['data','ad_id','alcance','visitas','v3s','p25','p50','p75','p100','thruplay','orc_conjunto','orc_campanha','status'], (r) => ({data: r.date, ad_id: String(r.ad_id), alcance: num(r.reach), visitas: num(r.actions_landing_page_view), v3s: num(r.actions_video_view),
    p25: num(r.video_p25_watched_actions_video_view), p50: num(r.video_p50_watched_actions_video_view), p75: num(r.video_p75_watched_actions_video_view), p100: num(r.video_p100_watched_actions_video_view), thruplay: num(r.video_thruplay_watched_actions_video_view),
    orc_conjunto: r.adset_daily_budget == null ? null : num(r.adset_daily_budget) / 100, orc_campanha: r.campaign_daily_budget == null ? null : num(r.campaign_daily_budget) / 100, status: r.effective_status || ''}))
});
dash.loader('meta_idade', {description: 'Uma linha por dia e idade.',
  fn: windsorLoader(['data','grupo','gasto','impressoes','cliques'], (r) => ({data: r.date, grupo: r.age, gasto: num(r.spend), impressoes: num(r.impressions), cliques: num(r.link_clicks)}))});
dash.loader('meta_aparelho', {description: 'Uma linha por dia e aparelho.',
  fn: windsorLoader(['data','grupo','gasto','impressoes','cliques'], (r) => ({data: r.date, grupo: r.impression_device === 'iphone' ? 'iPhone' : /android/.test(r.impression_device || '') ? 'Android' : 'Outros', gasto: num(r.spend), impressoes: num(r.impressions), cliques: num(r.link_clicks)}))});
dash.loader('meta_hora', {description: 'Uma linha por dia e hora.',
  fn: windsorLoader(['data','hora','gasto','impressoes','cliques'], (r) => ({data: r.date, hora: +String(r.hourly_stats_aggregated_by_audience_time_zone || '0').slice(0, 2), gasto: num(r.spend), impressoes: num(r.impressions), cliques: num(r.link_clicks)}))});
dash.loader('meta_conta', {description: 'Gasto e limite da conta em reais.',
  fn: windsorLoader(['gasto_total','limite','fatura'], (r) => ({gasto_total: num(r.amount_spent) / 100, limite: num(r.spend_cap) / 100, fatura: num(r.account_balance) / 100}))});
dash.loader('meta_fichas', {description: 'Segmentação de cada conjunto em colunas legíveis.',
  fn: windsorLoader(['ad_id','anuncio','conjunto','campanha','status','criado','post','video_medio','idade','local','interesses','cargos','comportamentos','incluidos','excluidos','advantage','plataformas','destino','otimizacao'], (r) => {
    let t = {}; try { t = (typeof r.adset_targeting === 'object' ? r.adset_targeting : JSON.parse(r.adset_targeting || '{}')) || {}; } catch (e) { t = {}; }
    const nm = (a) => (a || []).map((x) => x && x.name).filter(Boolean);
    const fs = {interests: [], behaviors: [], work_employers: [], work_positions: []};
    (t.flexible_spec || []).forEach((s) => Object.keys(fs).forEach((k) => { fs[k] = fs[k].concat(nm(s[k])); }));
    const g = t.geo_locations || {};
    const local = [].concat((g.cities || []).map((c) => c.name + (c.radius ? ' ' + c.radius + ' km' : '')), (g.custom_locations || []).map((c) => String(c.name || '').split(',')[0] + ' ' + c.radius + ' km'),
      (g.places || []).map((p) => p.name + ' ' + p.radius + ' km'), (g.neighborhoods || []).length ? [g.neighborhoods.length + ' bairros'] : [], (g.regions || []).map((x) => x.name)).join(' · ');
    const ar = t.age_range || [t.age_min, t.age_max];
    const dest = {ON_AD: 'Formulário Meta', WEBSITE_AND_LEAD_FORM: 'Formulário Meta + site', WEBSITE: 'Site', UNDEFINED: 'Site', WHATSAPP: 'WhatsApp'}[r.adset_destination_type] || r.adset_destination_type || '';
    const otim = {LEAD_GENERATION: 'Leads (formulário)', OFFSITE_CONVERSIONS: 'Conversão no site (Pixel)', VALUE: 'Valor da conversão', CONVERSATIONS: 'Conversas', LINK_CLICKS: 'Cliques', LANDING_PAGE_VIEWS: 'Visitas à página'}[r.adsset_optimization_goal] || r.adsset_optimization_goal || '';
    return {ad_id: String(r.ad_id), anuncio: r.ad_name, conjunto: r.adset_name, campanha: r.campaign, status: r.effective_status === 'ACTIVE' ? 'Ativo' : 'Pausado', criado: String(r.ad_created_time || '').slice(0, 10),
      post: r.instagram_permalink_url || '', video_medio: r.video_avg_time_watched_actions_video_view == null ? null : num(r.video_avg_time_watched_actions_video_view), idade: (ar[0] || 18) + '–' + (ar[1] || 65),
      local, interesses: fs.interests.join(', '), cargos: [...new Set(fs.work_positions.concat(fs.work_employers))].join(', '), comportamentos: fs.behaviors.join(', '),
      incluidos: nm(t.custom_audiences).join(', '), excluidos: nm(t.excluded_custom_audiences).join(', '), advantage: t.targeting_automation && t.targeting_automation.advantage_audience ? 'Ligado' : 'Desligado',
      plataformas: (t.publisher_platforms || []).join(' + '), destino: dest, otimizacao: otim};
  })});

dash.calc('comparativo', {
  inputs: ['meta_fichas', 'meta_ads', 'meta_criativo', 'meta_plac', 'todos', 'janela'],
  fn: (fichas, ads, cri, plac, todos, janela) => {
    const j = janela[0], ids = new Set(fichas.map((f) => f.ad_id)), dentro = (r) => ids.has(r.ad_id) && r.data >= j.de && r.data <= j.ate;
    const norm = (c) => String(c || '').trim().replace(/^_moobox_/, '').replace(/[_-](facebook-instagram|instagram)__.*$/, '');
    const pos = (po) => { po = (po || '').toLowerCase(); return po.includes('reel') ? 'Reels' : po.includes('stor') ? 'Stories' : po.includes('explor') ? 'Explorar' : po.includes('feed') ? 'Feed' : 'Outros'; };
    const A = d3.rollup(ads.filter(dentro), (v) => ({gasto: d3.sum(v, (r) => r.gasto), impressoes: d3.sum(v, (r) => r.impressoes), cliques: d3.sum(v, (r) => r.cliques), leads_meta: d3.sum(v, (r) => r.leads_meta)}), (r) => r.ad_id);
    const C = d3.rollup(cri.filter(dentro), (v) => ({alcance: d3.sum(v, (r) => r.alcance), v3s: d3.sum(v, (r) => r.v3s)}), (r) => r.ad_id);
    const P = d3.rollup(plac.filter(dentro), (v) => { const g = d3.rollups(v, (w) => d3.sum(w, (r) => r.gasto), (r) => pos(r.posicao)); const tot = d3.sum(g, (d) => d[1]); const b = d3.greatest(g, (d) => d[1]); return b && tot ? b[0] + ' (' + Math.round(b[1] / tot * 100) + '%)' : ''; }, (r) => r.ad_id);
    const T = d3.rollup(todos.filter((r) => r.perfil === 'moombox' && r.dia >= j.de && r.dia <= j.ate), (v) => ({n: v.length, ap: v.filter((r) => r.aprov).length, ex: v.filter((r) => r.expo).length}), (r) => norm(r.utm_campaign));
    const LC = d3.rollup(ads.filter((r) => r.perfil === 'moombox' && r.data >= j.de && r.data <= j.ate), (v) => ({leads: d3.sum(v, (r) => r.leads_meta), gasto: d3.sum(v, (r) => r.gasto)}), (r) => norm(r.campanha));
    return fichas.map((f) => { const a = A.get(f.ad_id) || {}, c = C.get(f.ad_id) || {}, t = T.get(norm(f.campanha)), lc = LC.get(norm(f.campanha)) || {};
      const g = a.gasto || 0, i = a.impressoes || 0, taxa = t && t.n >= 5 ? t.ap / t.n : null, aprov = a.leads_meta && taxa != null ? a.leads_meta * taxa : null;
      const expo_est = t && t.ex && lc.leads ? t.ex * (a.leads_meta || 0) / lc.leads : 0;
      return Object.assign({}, f, {chave: f.ad_id, perfil: 'moombox', gasto: g, cpm: i ? g / i * 1000 : null, ctr: i ? (a.cliques || 0) / i : null, gancho: i && c.v3s != null ? c.v3s / i : null, freq: c.alcance ? i / c.alcance : null,
        leads_meta: a.leads_meta || 0, cpl: a.leads_meta ? g / a.leads_meta : null, leads_camp: t ? t.n : 0, taxa_aprov: taxa, aprov_est: aprov, custo_aprov_est: aprov ? g / aprov : null, expos_camp: t ? t.ex : 0, expo_est, custo_expo_est: expo_est ? g / expo_est : null, cac_camp: t && t.ex && lc.gasto ? lc.gasto / t.ex : null, melhor_posicao: P.get(f.ad_id) || ''}); })
      .filter((r) => r.gasto > 0).sort((a, b) => b.gasto - a.gasto);
  }
});

dash.calc('janela', {
  inputs: [],
  fn: (_leads) => {
    const p = dash.params(), f = d3.timeFormat('%Y-%m-%d'), hoje = d3.timeDay.floor(new Date());
    let de, ate;
    if (p.periodo === 'custom' && p.de && p.ate) { de = d3.timeParse('%Y-%m-%d')(p.de); ate = d3.timeParse('%Y-%m-%d')(p.ate); if (de > ate) [de, ate] = [ate, de]; }
    else if (p.periodo === 'ontem') { de = ate = d3.timeDay.offset(hoje, -1); }
    else if (/^mes:\d{4}-\d{2}$/.test(p.periodo || '')) { de = d3.timeParse('%Y-%m-%d')(p.periodo.slice(4) + '-01'); ate = d3.timeDay.offset(d3.timeMonth.offset(de, 1), -1); if (ate > hoje) ate = hoje; }
    else { const n = +p.periodo || 30; ate = hoje; de = d3.timeDay.offset(hoje, -(n - 1)); }
    const dias = d3.timeDay.count(de, ate) + 1;
    return [{mes: /^mes:/.test(p.periodo || ''), periodo: p.periodo === 'custom' ? 'custom' : String(p.periodo || '30'), perfil: p.perfil || 'todos', de: f(de), ate: f(ate), dias, ant_de: f(d3.timeDay.offset(de, -dias)), ant_ate: f(d3.timeDay.offset(de, -1))}];
  }
});
dash.calc('todos', {
  inputs: ['leads'],
  fn: (leads) => {
    const canal = (o) => { o = o.toLowerCase();
      if (o.startsWith('leads meta')) return 'Formulário Meta';
      if (o.startsWith('landing page')) return 'Landing page';
      if (o === 'whatsapp ad') return 'WhatsApp (anúncio)';
      if (o.startsWith('whatsapp')) return 'WhatsApp (orgânico)';
      if (o.includes('instagram') || o.includes('bdr') || o.includes('rua teresa')) return 'Instagram / prospecção';
      if (o.includes('painel de contratos')) return 'Painel de Contratos (origem não registrada)';
      if (/rebeca|jakeline|julia|júlia|outbound|vivi|ligação|ligacao|adriana|samila|simone|kamilly|matheus|thiago|paula/.test(o)) return 'Captação ativa (equipe)';
      if (/feira|indica/.test(o)) return 'Feiras e indicações';
      return o ? 'Outros' : 'Sem origem'; };
    const etapa = (s) => {
      if (/^7/.test(s)) return 'expositor';
      if (/^[456]/.test(s)) return 'proposta';
      if (/^3/.test(s)) return 'oportunidade';
      if (/^2/.test(s)) return 'aprovada';
      if (/^[01]/.test(s)) return 'entrada';
      if (/^X/.test(s)) return 'perdida';
      return 'outros'; };
    const pos = (s) => { s = (s || '').toLowerCase(); if (!s) return ''; if (s.includes('reel')) return 'Reels'; if (s.includes('stor')) return 'Stories'; if (s.includes('explor')) return 'Explorar'; if (s.includes('feed')) return 'Feed'; return 'Outros'; };
    return leads.filter((r) => r.dia && !/teste/i.test(r.marca) && r.marca !== '@asdasda')
      .map((r) => { r = Object.assign({observacoes: '', utm_content: '', utm_campaign: '', utm_medium: ''}, r); r.observacoes = String(r.observacoes || ''); r.utm_content = String(r.utm_content || ''); const ad = (r.observacoes.match(/(?:ad|term)=([0-9]{6,})/) || [])[1] || ''; const pl = (r.observacoes.match(/pos=([A-Za-z_]+)/) || [])[1] || '';
        const e = etapa(r.status);
        return {id: r.id, dia: r.dia, canal: canal(r.origem), pago: ['Formulário Meta','Landing page','WhatsApp (anúncio)'].includes(canal(r.origem)) || /julia|lpns/i.test(r.utm_campaign + ' ' + r.utm_medium), etapa: e, aprov: ['aprovada','oportunidade','proposta','expositor'].includes(e), expo: e === 'expositor',
          perfil: /julia|lpns/i.test(r.utm_campaign + ' ' + r.utm_medium) ? 'julia' : 'moombox', ad_id: ad, posicionamento: pos(pl),
          status: r.status, utm_campaign: r.utm_campaign, utm_medium: r.utm_medium, utm_content: r.utm_content, marca: r.marca, origem: r.origem, criado_em: r.criado_em, fbclid: r.tem_fbclid === 'sim', compra: r.compra || '', loja: r.loja || '', mensalidade: r.mensalidade || 0, mudou: r.mudou || '', resp: r.resp || '', faturamento: r.faturamento || ''}; });
  }
});
dash.calc('base', {
  inputs: ['todos', 'janela'],
  fn: (todos, janela) => { const j = janela[0]; return todos.filter((r) => r.dia >= j.de && r.dia <= j.ate && (j.perfil === 'todos' || r.perfil === j.perfil)).sort((a, b) => d3.descending(a.criado_em, b.criado_em)); }
});
dash.calc('julia_leads', {
  inputs: ['todos', 'janela'],
  fn: (todos, janela) => { const j = janela[0]; return todos.filter((r) => PAGO(r, j.perfil) && r.dia >= j.de && r.dia <= j.ate); }
});
dash.calc('ads_per', {
  inputs: ['meta_ads', 'janela'],
  fn: (ads, janela) => { const j = janela[0]; return PF(ads).filter((r) => r.data >= j.de && r.data <= j.ate); }
});
dash.calc('kpis', {
  inputs: ['base', 'todos', 'janela'],
  fn: (base, todos, janela) => {
    const j = janela[0];
    const ant = todos.filter((r) => r.dia >= j.ant_de && r.dia <= j.ant_ate && (j.perfil === 'todos' || r.perfil === j.perfil)).length;
    const per = todos.filter((r) => r.dia >= j.de && r.dia <= j.ate);
    const aprov = base.filter((r) => r.aprov).length;
    return [{
      leads: base.length, leads_ant: ant, var_leads: ant ? base.length / ant - 1 : null,
      aprovados: aprov, taxa_aprov: base.length ? aprov / base.length : 0,
      oportunidades: base.filter((r) => ['oportunidade','proposta','expositor'].includes(r.etapa)).length,
      expositores: base.filter((r) => r.expo).length,
      expo_lista: base.filter((r) => r.expo).map((r) => ({marca: r.marca, dia: r.dia, status: r.status, canal: r.canal})),
      leads_moombox: per.filter((r) => r.perfil === 'moombox').length,
      leads_julia: per.filter((r) => r.perfil === 'julia').length
    }];
  }
});
dash.calc('custos', {
  inputs: ['meta_ads', 'todos', 'janela'],
  fn: (ads, todos, janela) => {
    const j = janela[0]; ads = PF(ads);
    const soma = (de, ate) => { const a = ads.filter((r) => r.data >= de && r.data <= ate); const l = todos.filter((r) => PAGO(r, j.perfil) && r.dia >= de && r.dia <= ate);
      const g = d3.sum(a, (r) => r.gasto), c = d3.sum(a, (r) => r.cliques), ap = l.filter((r) => r.aprov).length, op = l.filter((r) => ['oportunidade','proposta','expositor'].includes(r.etapa)).length, ex = l.filter((r) => r.expo).length;
      return {gasto: g, cliques: c, cpc: c ? g / c : null, leads: l.length, cpl: l.length ? g / l.length : null, aprovados: ap, custo_aprov: ap ? g / ap : null, oportunidades: op, custo_opor: op ? g / op : null, expositores: ex, cac: ex ? g / ex : null, expo_lista: l.filter((r) => r.expo).map((r) => ({marca: r.marca, dia: r.dia, status: r.status, canal: r.canal}))}; };
    const at = soma(j.de, j.ate), an = soma(j.ant_de, j.ant_ate);
    const v = (x, y) => (x != null && y) ? x / y - 1 : null;
    return [Object.assign(at, {var_gasto: v(at.gasto, an.gasto), var_cpc: v(at.cpc, an.cpc)})];
  }
});
dash.calc('canais', {
  inputs: ['base'],
  fn: (base) => d3.rollups(base, (v) => {
      const ap = v.filter((r) => r.aprov).length;
      return {leads: v.length, aprovados: ap, taxa_aprov: ap / v.length,
        oportunidades: v.filter((r) => ['oportunidade','proposta','expositor'].includes(r.etapa)).length,
        expositores: v.filter((r) => r.expo).length,
        parados: v.filter((r) => r.etapa === 'entrada').length,
        perdidos: v.filter((r) => r.etapa === 'perdida').length,
        expo_marcas: v.filter((r) => r.expo).map((r) => r.marca + ' — ' + (r.origem || 'sem origem') + ' (entrou ' + MB.dm(r.dia) + ')').join('\n'),
        origens: d3.rollups(v, (x) => x.length, (r) => r.origem || 'sem origem').sort((a, b) => b[1] - a[1]).map(([o, n]) => n + '× ' + o).join('\n')};
    }, (r) => r.canal).map(([canal, o]) => Object.assign({canal}, o)).sort((a, b) => b.leads - a.leads)
});
dash.calc('diario', {
  inputs: ['base', 'ads_per', 'janela'],
  fn: (base, ads, janela) => {
    const j = janela[0], p = d3.timeParse('%Y-%m-%d'), f = d3.timeFormat('%Y-%m-%d');
    const L = d3.rollup(base, (v) => v.length, (r) => r.dia), G = d3.rollup(ads, (v) => d3.sum(v, (r) => r.gasto), (r) => r.data);
    return d3.timeDays(p(j.de), d3.timeDay.offset(p(j.ate), 1)).map((d) => ({dia: f(d), leads: L.get(f(d)) || 0, gasto: G.get(f(d)) || 0}));
  }
});
dash.calc('posicionamentos', {
  inputs: ['meta_plac', 'julia_leads', 'janela'],
  fn: (plac, leads, janela) => {
    const j = janela[0];
    const nome = (pl, po) => { po = (po || '').toLowerCase(); return po.includes('reel') ? 'Reels' : po.includes('stor') ? 'Stories' : po.includes('explor') ? 'Explorar' : po.includes('feed') ? 'Feed' : 'Outros'; };
    const rows = d3.rollups(PF(plac).filter((r) => r.data >= j.de && r.data <= j.ate), (v) => ({gasto: d3.sum(v, (r) => r.gasto), impressoes: d3.sum(v, (r) => r.impressoes), cliques: d3.sum(v, (r) => r.cliques)}), (r) => nome(r.plataforma, r.posicao));
    return rows.map(([posicionamento, o]) => { const l = leads.filter((r) => r.posicionamento === posicionamento), ap = l.filter((r) => r.aprov).length;
      return {posicionamento, gasto: o.gasto, impressoes: o.impressoes, cliques: o.cliques, ctr: o.impressoes ? o.cliques / o.impressoes : null, cpc: o.cliques ? o.gasto / o.cliques : null, leads: l.length, cpl: l.length ? o.gasto / l.length : null, aprovados: ap, custo_aprov: ap ? o.gasto / ap : null}; })
      .filter((r) => r.gasto > 0).sort((a, b) => b.gasto - a.gasto);
  }
});
dash.calc('anuncios', {
  inputs: ['ads_per', 'julia_leads'],
  fn: (ads, leads) => d3.rollups(ads, (v) => ({gasto: d3.sum(v, (r) => r.gasto), cliques: d3.sum(v, (r) => r.cliques), leads_pixel: d3.sum(v, (r) => r.leads_pixel), anuncio: v[0].anuncio, conjunto: v[0].conjunto, conjunto_id: v[0].conjunto_id, perfil: v[0].perfil}), (r) => r.ad_id)
    .map(([ad_id, o]) => { const l = leads.filter((r) => r.ad_id === ad_id || (!r.ad_id && r.utm_content && (r.utm_content === o.anuncio || r.utm_content === o.conjunto + '__' + o.anuncio))); const ap = l.filter((r) => r.aprov).length;
      return {chave: ad_id, anuncio: o.anuncio, conjunto: o.conjunto, conjunto_id: o.conjunto_id, perfil: o.perfil, gasto: o.gasto, cliques: o.cliques, cpc: o.cliques ? o.gasto / o.cliques : null, leads: l.length, cpl: l.length ? o.gasto / l.length : null, aprovados: ap, custo_aprov: ap ? o.gasto / ap : null, leads_pixel: o.leads_pixel}; })
    .filter((r) => r.gasto > 0).sort((a, b) => b.gasto - a.gasto)
});
dash.calc('publicos', {
  inputs: ['ads_per', 'julia_leads'],
  fn: (ads, leads) => {
    const adset = d3.rollup(ads, (v) => v[0].conjunto, (r) => r.ad_id);
    return d3.rollups(ads, (v) => ({gasto: d3.sum(v, (r) => r.gasto), cliques: d3.sum(v, (r) => r.cliques), conjunto_id: v[0].conjunto_id, perfil: v[0].perfil}), (r) => r.conjunto)
      .map(([conjunto, o]) => { const l = leads.filter((r) => (r.ad_id && adset.get(r.ad_id) === conjunto) || (!r.ad_id && (r.utm_medium === conjunto || r.utm_content.startsWith(conjunto + '__')))); const ap = l.filter((r) => r.aprov).length, ex = l.filter((r) => r.expo).length;
        return {conjunto, conjunto_id: o.conjunto_id, perfil: o.perfil, gasto: o.gasto, cliques: o.cliques, cpc: o.cliques ? o.gasto / o.cliques : null, leads: l.length, cpl: l.length ? o.gasto / l.length : null, aprovados: ap, custo_aprov: ap ? o.gasto / ap : null, expositores: ex, cac: ex ? o.gasto / ex : null}; })
      .filter((r) => r.gasto > 0).sort((a, b) => b.gasto - a.gasto);
  }
});
dash.calc('safras', {
  inputs: ['todos', 'janela'],
  fn: (todos, janela) => { const pf = janela[0].perfil;
    return d3.rollups(todos.filter((r) => pf === 'todos' || r.perfil === pf), (v) => { const ap = v.filter((r) => r.aprov).length, ex = v.filter((r) => r.expo).length;
      return {leads: v.length, taxa_aprov: ap / v.length, oportunidades: v.filter((r) => ['oportunidade','proposta','expositor'].includes(r.etapa)).length, expositores: ex, taxa_expo: ex / v.length}; }, (r) => r.dia.slice(0, 7))
      .map(([mes, o]) => Object.assign({mes}, o)).sort((a, b) => d3.descending(a.mes, b.mes)); }
});
dash.calc('rastreio', {
  inputs: ['base', 'todos'],
  fn: (base, todos) => {
    const lp = base.filter((r) => r.canal === 'Landing page');
    const chave = (m) => m.toLowerCase().replace(/[^a-z0-9]/g, '');
    const nomes = d3.rollup(todos, (v) => v.length, (r) => chave(r.marca));
    const dup = base.filter((r) => r.canal === 'WhatsApp (anúncio)' && (nomes.get(chave(r.marca)) || 0) > 1).length;
    return [
      {problema: 'UTM com macro não preenchida ({{...}})', leads: base.filter((r) => (r.utm_campaign + r.utm_medium).includes('{{')).length, gravidade: 'alto'},
      {problema: 'Landing page sem nenhuma UTM', leads: lp.filter((r) => !r.utm_campaign && !r.utm_medium).length, gravidade: 'alto'},
      {problema: 'WhatsApp de anúncio parado em “Chegou no WhatsApp”', leads: base.filter((r) => r.canal === 'WhatsApp (anúncio)' && r.etapa === 'entrada').length, gravidade: 'médio'},
      {problema: 'WhatsApp de anúncio com a mesma marca em outro registro', leads: dup, gravidade: 'médio'},
      {problema: 'Lead sem origem preenchida', leads: base.filter((r) => r.canal === 'Sem origem').length, gravidade: 'baixo'}
    ];
  }
});
dash.calc('cri_per', {
  inputs: ['meta_criativo', 'janela'],
  fn: (cri, janela) => { const j = janela[0]; return PF(cri).filter((r) => r.data >= j.de && r.data <= j.ate); }
});
dash.calc('conta', {
  inputs: ['meta_conta', 'meta_criativo', 'meta_ads', 'ads_per', 'janela'],
  fn: (conta, cri, ads, adsPer, janela) => {
    const j = janela[0], cs = PF(conta).filter((c) => c.limite > 0); cri = PF(cri);
    const restante = cs.length ? d3.sum(cs, (c) => Math.max(0, c.limite - c.gasto_total)) : null;
    const ultimo = d3.max(cri, (r) => r.data);
    const conj = d3.rollup(ads, (v) => v[0].conjunto, (r) => r.ad_id), camp = d3.rollup(ads, (v) => v[0].campanha, (r) => r.ad_id);
    const ativos = cri.filter((r) => r.data === ultimo && r.status === 'ACTIVE');
    const orcConj = new Map(), orcCamp = new Map();
    ativos.forEach((r) => { if (r.orc_campanha) orcCamp.set(camp.get(r.ad_id) || r.ad_id, r.orc_campanha); else if (r.orc_conjunto) orcConj.set(conj.get(r.ad_id) || r.ad_id, r.orc_conjunto); });
    const orcamento_dia = d3.sum([...orcConj.values()]) + d3.sum([...orcCamp.values()]);
    const gasto = d3.sum(adsPer, (r) => r.gasto);
    return [{restante, orcamento_dia: orcamento_dia || null, dias_saldo: restante != null && orcamento_dia ? restante / orcamento_dia : null, ritmo: orcamento_dia ? gasto / (orcamento_dia * j.dias) : null}];
  }
});
dash.calc('criativos', {
  inputs: ['ads_per', 'cri_per'],
  fn: (ads, cri) => {
    const C = d3.rollup(cri, (v) => ({alcance: d3.sum(v, (r) => r.alcance), visitas: d3.sum(v, (r) => r.visitas), v3s: d3.sum(v, (r) => r.v3s), p25: d3.sum(v, (r) => r.p25), p50: d3.sum(v, (r) => r.p50), p75: d3.sum(v, (r) => r.p75), p100: d3.sum(v, (r) => r.p100), thruplay: d3.sum(v, (r) => r.thruplay)}), (r) => r.ad_id);
    return d3.rollups(ads, (v) => ({anuncio: v[0].anuncio, conjunto: v[0].conjunto, conjunto_id: v[0].conjunto_id, perfil: v[0].perfil, gasto: d3.sum(v, (r) => r.gasto), impressoes: d3.sum(v, (r) => r.impressoes), cliques: d3.sum(v, (r) => r.cliques)}), (r) => r.ad_id)
      .map(([id, o]) => { const c = C.get(id) || {}; const i = o.impressoes || 0; const q = (x) => i ? (x || 0) / i : null;
        return {chave: id, anuncio: o.anuncio, conjunto: o.conjunto, conjunto_id: o.conjunto_id, perfil: o.perfil, gasto: o.gasto, impressoes: i, cliques: o.cliques, visitas: c.visitas || 0, freq: c.alcance ? i / c.alcance : null, cpm: i ? o.gasto / i * 1000 : null, ctr: q(o.cliques),
          gancho: q(c.v3s), p25: q(c.p25), p50: q(c.p50), p75: q(c.p75), p100: q(c.p100), thruplay: q(c.thruplay), chegada: o.cliques ? (c.visitas || 0) / o.cliques : null, custo_visita: c.visitas ? o.gasto / c.visitas : null}; })
      .filter((r) => r.impressoes > 0).sort((a, b) => b.gasto - a.gasto);
  }
});
dash.calc('funil_midia', {
  inputs: ['ads_per', 'cri_per', 'julia_leads'],
  fn: (ads, cri, leads) => {
    const g = d3.sum(ads, (r) => r.gasto);
    const E = [['Impressões', d3.sum(ads, (r) => r.impressoes)], ['Alcance (soma diária)', d3.sum(cri, (r) => r.alcance)], ['Assistiram 3s+', d3.sum(cri, (r) => r.v3s)], ['Cliques no link', d3.sum(ads, (r) => r.cliques)],
      ['Visitas à página', d3.sum(cri, (r) => r.visitas)], ['Leads (Airtable)', leads.length], ['Aprovadas ou além', leads.filter((r) => r.aprov).length], ['Oportunidades ou além', leads.filter((r) => ['oportunidade','proposta','expositor'].includes(r.etapa)).length], ['Expositoras', leads.filter((r) => r.expo).length]];
    return E.map(([etapa, valor], i) => ({etapa, valor, pct: i && E[i - 1][1] ? valor / E[i - 1][1] : null, custo: i && valor ? g / valor : null}));
  }
});
const grupos = (id, titulo, fonte, chave) => dash.calc(id, {
  inputs: [fonte, 'janela'],
  fn: (rows, janela) => { const j = janela[0]; const f = PF(rows).filter((r) => r.data >= j.de && r.data <= j.ate); const G = d3.sum(f, (r) => r.gasto), K = d3.sum(f, (r) => r.cliques);
    return d3.rollups(f, (v) => ({gasto: d3.sum(v, (r) => r.gasto), impressoes: d3.sum(v, (r) => r.impressoes), cliques: d3.sum(v, (r) => r.cliques)}), chave)
      .map(([grupo, o]) => ({grupo, gasto: o.gasto, pct_gasto: G ? o.gasto / G : null, cliques: o.cliques, pct_cliques: K ? o.cliques / K : null, ctr: o.impressoes ? o.cliques / o.impressoes : null, cpc: o.cliques ? o.gasto / o.cliques : null}))
      .filter((r) => r.gasto > 0 || r.cliques > 0).sort((a, b) => String(a.grupo).localeCompare(String(b.grupo))); }
});
grupos('idades', 'Idade', 'meta_idade', (r) => r.grupo);
grupos('aparelhos', 'Aparelho', 'meta_aparelho', (r) => r.grupo);
grupos('horarios', 'Horário', 'meta_hora', (r) => r.hora < 6 ? '1 Madrugada (0–5h)' : r.hora < 12 ? '2 Manhã (6–11h)' : r.hora < 18 ? '3 Tarde (12–17h)' : '4 Noite (18–23h)');
dash.calc('sugestoes', {
  inputs: ['conta', 'criativos', 'aparelhos', 'custos', 'ads_per'],
  fn: (conta, cri, apar, custos, ads) => {
    const out = [], c = conta[0] || {};
    if (c.dias_saldo != null && c.dias_saldo < 2) out.push(['Saldo', 'O saldo dura só ~' + c.dias_saldo.toFixed(1).replace('.', ',') + ' dia(s). Recarregue para os anúncios não pausarem.']);
    if (c.ritmo != null && c.ritmo < 0.7) out.push(['Ritmo', 'A conta gastou ' + Math.round(c.ritmo * 100) + '% do orçamento previsto: público pequeno, anúncio em análise ou sem saldo.']);
    const v = cri.filter((r) => r.gasto >= 5 && r.visitas >= 3 && r.custo_visita);
    if (v.length > 1) { const b = d3.least(v, (r) => r.custo_visita), w = d3.greatest(v, (r) => r.custo_visita); if (w.custo_visita >= 2 * b.custo_visita) out.push(['Verba', '“' + w.anuncio + '” (' + w.conjunto + ') custa ' + (w.custo_visita / b.custo_visita).toFixed(1).replace('.', ',') + '× mais por visita que “' + b.anuncio + '” (' + b.conjunto + '). Tire verba do pior.']); }
    const i = apar.find((r) => r.grupo === 'iPhone'), a = apar.find((r) => r.grupo === 'Android');
    if (i && a && i.cpc && a.cpc && a.cpc >= 1.8 * i.cpc) out.push(['Aparelho', 'Android custa ' + (a.cpc / i.cpc).toFixed(1).replace('.', ',') + '× mais por clique que iPhone. Avalie reduzir o conjunto Android.']);
    cri.filter((r) => r.freq && r.freq > 2.5 && r.impressoes >= 300).forEach((r) => out.push(['Cansaço', '“' + r.anuncio + '” (' + r.conjunto + ') com frequência ' + r.freq.toFixed(1).replace('.', ',') + ': as mesmas pessoas estão vendo demais. Troque o criativo ou amplie o público.']));
    cri.filter((r) => r.gancho != null && r.impressoes >= 500 && r.gancho < 0.1).forEach((r) => out.push(['Criativo', '“' + r.anuncio + '” (' + r.conjunto + ') prende só ' + Math.round(r.gancho * 100) + '% nos 3 primeiros segundos. Teste outra abertura.']));
    const k = custos[0] || {};
    if (k.gasto > 20 && !k.leads) out.push(['Rastreio', 'R$ ' + Math.round(k.gasto) + ' investidos sem nenhum lead de anúncio no Airtable. Confira se os anúncios levam para a lpns.']);
    if (!out.length) out.push(['OK', 'Nenhum alerta no período.']);
    return out.map(([tipo, texto], n) => ({n: n + 1, tipo, texto}));
  }
});
// Fechadas pela data de compra (campo Purchase), igual à visão "✅ Purchase (↑purchase) from Meta"
dash.calc('fechadas', {
  inputs: ['todos', 'meta_ads', 'janela'],
  fn: (todos, ads, janela) => {
    const atrib = dash.params().atrib === 'equipe' ? 'equipe' : 'anuncio';
    const j = janela[0], okStatus = (s) => /^(6 - |7 - )/.test(s) || /^X - Exp Aviso/.test(s) || s === 'X - Ex Expositor';
    const l = todos.filter((r) => r.compra && r.compra >= j.de && r.compra <= j.ate && okStatus(r.status) && (j.perfil === 'todos' || r.perfil === j.perfil))
      .map((r) => ({marca: r.marca, dia: r.compra, entrou: r.dia, status: r.status, canal: r.canal, origem: r.origem, loja: r.loja, mensalidade: r.mensalidade, ads: atrib === 'equipe' ? /meta|whats|land/i.test(r.origem) : (r.pago || r.fbclid || /moobox|facebook|instagram|meta|julia|lpns/i.test(r.utm_campaign + ' ' + r.utm_medium))}));
    const dd = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
    l.forEach((r) => { r.dias = r.entrou ? dd(r.entrou, r.dia) : null; r.novo = r.dias != null && r.dias >= 0 && r.dias <= 90; });
    const ad = l.filter((r) => r.ads), g = d3.sum(PF(ads).filter((r) => r.data >= j.de && r.data <= j.ate), (r) => r.gasto);
    const por = (k) => d3.rollups(ad, (v) => v.length, (r) => r.loja || 's/ loja').sort((a, b) => b[1] - a[1]).map(([lj, n]) => lj + ' ' + n).join(' · ');
    const nv = ad.filter((r) => r.novo), ds = nv.map((r) => r.dias);
    return [{atrib, novas: nv.length, antigas: ad.length - nv.length, dias_medio: ds.length ? d3.mean(ds) : null, dias_mediana: ds.length ? d3.median(ds) : null, dias_min: ds.length ? d3.min(ds) : null, dias_max: ds.length ? d3.max(ds) : null,
      ciclo: nv.slice().sort((a, b) => a.dias - b.dias).map((r) => ({marca: r.marca, entrou: r.entrou, fechou: r.dia, dias: r.dias, canal: r.canal, loja: r.loja})),
      fechadas: ad.length, fechadas_total: l.length, custo: ad.length ? g / ad.length : null, lojas: por(), mensal: d3.sum(ad, (r) => r.mensalidade),
      expo_lista: ad.map((r) => ({marca: r.marca, dia: r.dia, status: r.status, canal: r.canal + (r.loja ? ' · ' + r.loja : '') + (r.novo ? ' · entrou ' + MB.dm(r.entrou) + ' → ' + r.dias + ' dias' : ' · lead antigo (' + (r.entrou ? MB.mes(r.entrou) : 's/ data') + ')')})),
      outras_lista: l.filter((r) => !r.ads).map((r) => ({marca: r.marca, dia: r.dia, status: r.status, canal: (r.origem || 'sem origem') + (r.loja ? ' · ' + r.loja : '')}))}];
  }
});
dash.calc('travadas', {
  inputs: ['base'],
  fn: (base) => {
    const hoje = d3.timeFormat('%Y-%m-%d')(new Date()), dd = (a) => a ? Math.round((Date.parse(hoje) - Date.parse(a)) / 864e5) : null;
    const lim = {entrada: 3, aprovada: 7, oportunidade: 7, proposta: 5}, ord = {proposta: 0, oportunidade: 1, aprovada: 2, entrada: 3};
    const nomes = {entrada: 'Sem avançar (0/1)', aprovada: 'Aprovada', oportunidade: 'Oportunidade', proposta: 'Proposta / contrato'};
    const l = base.filter((r) => lim[r.etapa] != null).map((r) => { const ref = r.mudou && r.mudou >= r.dia ? r.mudou : r.dia; return {marca: r.marca, etapa: r.etapa, etapa_nome: nomes[r.etapa], status: r.status, entrou: r.dia, parada: dd(ref), canal: r.canal, loja: r.loja, resp: r.resp, id: r.id}; })
      .filter((r) => r.parada != null && r.parada > lim[r.etapa]).sort((a, b) => ord[a.etapa] - ord[b.etapa] || b.parada - a.parada);
    const perd = base.filter((r) => r.etapa === 'perdida'), motivo = d3.rollups(perd, (v) => v.length, (r) => r.status.replace(/^X - /, '').replace(/[☠️⛔️]/g, '').trim()).sort((a, b) => b[1] - a[1]);
    const cont = (e) => l.filter((r) => r.etapa === e).length;
    return [{n: l.length, proposta: cont('proposta'), oportunidade: cont('oportunidade'), aprovada: cont('aprovada'), entrada: cont('entrada'), perdidas: perd.length, taxa_perda: base.length ? perd.length / base.length : null,
      motivos: motivo.map(([m, n]) => m + ' ' + n).join(' · '), lista: l}];
  }
});
dash.calc('campanhas', {
  inputs: ['base', 'ads_per'],
  fn: (base, ads) => {
    const norm = (c) => String(c || '').trim().replace(/^_moobox_/, '').replace(/[_-](facebook-instagram|instagram)__.*$/, '');
    const nome = (r) => { const c = (r.utm_campaign || '').trim(); if (!c) return '(sem UTM) ' + r.canal; if (c.includes('{{')) return '(UTM quebrada)';
      if (/captacao-julia/i.test(c)) return 'Captação Marcas | Julia | NorteShopping 5km | Nov26'; return norm(c); };
    const G = d3.rollup(ads, (v) => ({gasto: d3.sum(v, (r) => r.gasto), cliques: d3.sum(v, (r) => r.cliques), perfil: v[0].perfil, ids: [...new Set(v.map((r) => r.campanha_id).filter(Boolean))].join(',')}), (r) => norm(r.campanha));
    const rows = d3.rollups(base, (v) => { const ap = v.filter((r) => r.aprov).length, ex = v.filter((r) => r.expo).length;
      return {leads: v.length, aprovados: ap, taxa_aprov: ap / v.length, oportunidades: v.filter((r) => ['oportunidade','proposta','expositor'].includes(r.etapa)).length, expositores: ex, taxa_expo: ex / v.length}; }, nome)
      .map(([campanha, o]) => { const g = G.get(campanha); return Object.assign({campanha}, o, {perfil: g ? g.perfil : null, campanha_ids: g ? g.ids : '', gasto: g ? g.gasto : null, cpc: g && g.cliques ? g.gasto / g.cliques : null, custo_aprov: g && o.aprovados ? g.gasto / o.aprovados : null, cac: g && o.expositores ? g.gasto / o.expositores : null}); });
    G.forEach((g, campanha) => { if (!rows.find((r) => r.campanha === campanha) && g.gasto > 0) rows.push({campanha, perfil: g.perfil, campanha_ids: g.ids, leads: 0, aprovados: 0, taxa_aprov: null, oportunidades: 0, expositores: 0, taxa_expo: null, gasto: g.gasto, cpc: g.cliques ? g.gasto / g.cliques : null, custo_aprov: null, cac: null}); });
    return rows.sort((a, b) => b.expositores - a.expositores || b.aprovados - a.aprovados || b.leads - a.leads);
  }
});

dash.calc('reprovados', {
  inputs: ['base'],
  fn: (base) => {
    const FAT = {'ainda_não_vendo': 'ainda não vende', 'até_r$_5_mil': 'até 5 mil', 'r$_5_mil_a_r$_10_mil': '5–10 mil', 'r$_10_mil_a_r$_30_mil': '10–30 mil', 'r$_30_mil_a_r$_100_mil': '30–100 mil', 'acima_de_r$_100_mil': '100 mil+'};
    const fat = (f) => FAT[f] || (f ? f.replace(/_/g, ' ') : 'sem faturamento');
    const norm = (c) => String(c || '').trim().replace(/^_moobox_/, '').replace(/[_-](facebook-instagram|instagram)__.*$/, '');
    const camp = (r) => { const c = (r.utm_campaign || '').trim(); if (!c) return ''; if (c.includes('{{')) return '(UTM quebrada)'; if (/captacao-julia/i.test(c)) return 'Captação Julia NS'; return norm(c); };
    const reprov = (r) => /^x\s*-\s*reprov/i.test(r.status);
    const rows = d3.rollups(base, (v) => {
      const rp = v.filter(reprov), ni = v.filter((r) => /^x\s*-\s*n[ãa]o interess/i.test(r.status)).length;
      const fx = d3.rollups(rp, (x) => x.length, (r) => fat(r.faturamento)).sort((a, b) => b[1] - a[1]);
      return {canal: v[0].canal, campanha: camp(v[0]), anuncio: v[0].utm_content ? MB.curto(v[0].utm_content) : '', leads: v.length, reprovados: rp.length, taxa_reprov: rp.length / v.length, nao_interessados: ni,
        aprovados: v.filter((r) => r.aprov).length,
        fat_resumo: fx.slice(0, 2).map(([f, n]) => f + ' (' + n + ')').join(' · '),
        fat_baixo: rp.length ? rp.filter((r) => /ainda_não_vendo|até_r\$_5_mil|^$/.test(r.faturamento)).length / rp.length : null,
        marcas: rp.map((r) => MB.dm(r.dia) + ' · ' + r.marca + ' · ' + fat(r.faturamento)).join('\n')};
    }, (r) => r.canal + '|' + camp(r) + '|' + (r.utm_content ? MB.curto(r.utm_content) : ''))
      .map(([k, o]) => o).filter((o) => o.reprovados > 0 || o.leads >= 3);
    return rows.sort((a, b) => b.reprovados - a.reprovados || b.taxa_reprov - a.taxa_reprov);
  }
});

window.MB = {
  brl: (v) => v == null || !isFinite(v) ? '—' : 'R$ ' + v.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}),
  int: (v) => v == null ? '—' : Math.round(v).toLocaleString('pt-BR'),
  pct: (v) => v == null || !isFinite(v) ? '—' : (v * 100).toLocaleString('pt-BR', {maximumFractionDigits: 1}) + '%',
  dm: (s) => s ? s.slice(8, 10) + '/' + s.slice(5, 7) : '',
  curto: (s) => { s = String(s || '').replace(/^[a-z0-9]{6,10}_/, ''); const p = s.split('__'); return (p.length > 1 ? p[p.length - 1] : s).replace(/^_+|_+$/g, '') || s; },
  CONTAS: {julia: {act: '971157280803730', biz: '761879491116813'}, moombox: {act: '2868359933189609', biz: ''}},
  linkMeta: (perfil, nivel, id, texto, titulo) => {
    const c = MB.CONTAS[perfil === 'julia' ? 'julia' : 'moombox'], a = document.createElement('a');
    a.href = 'https://adsmanager.facebook.com/adsmanager/manage/' + nivel + '?act=' + c.act + (c.biz ? '&business_id=' + c.biz : '') + (id ? '&selected_' + ({ads: 'ad', adsets: 'adset', campaigns: 'campaign'})[nivel] + '_ids=' + encodeURIComponent(id) : '');
    a.target = '_blank'; a.rel = 'noopener'; a.title = 'Abrir no Gerenciador de Anúncios: ' + titulo; a.textContent = texto + ' ↗'; a.style.color = 'inherit';
    return a;
  },
  celAnuncio: (td, r) => {
    td.className = 'wrap';
    const s = document.createElement('div'); s.className = 'muted'; s.style.fontSize = 'var(--cds-font-size-caption)';
    s.append((r.perfil === 'julia' ? 'Julia · ' : 'Moombox · '), MB.linkMeta(r.perfil, 'adsets', r.conjunto_id, MB.curto(r.conjunto), r.conjunto));
    td.append(MB.linkMeta(r.perfil, 'ads', r.chave, MB.curto(r.anuncio), r.anuncio), s);
  },
  mes: (s) => { const m = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']; return m[+s.slice(5, 7) - 1] + '/' + s.slice(2, 4); }
};
