// Busca os dados de cada fonte do painel com as chaves guardadas na Vercel.
// A senha do painel é checada aqui também (além do middleware).
const { temCookie } = require('./_cookie');

const ACC_MOOMBOX = '2868359933189609';
const ACC_JULIA = '971157280803730';
const BOTH = [ACC_MOOMBOX, ACC_JULIA];

const WINDSOR = {
  meta_ads: { accounts: BOTH, preset: 'last_90dT', fields: ['account_id','date','campaign','adset_name','adset_id','ad_name','ad_id','spend','impressions','link_clicks','actions_offsite_conversion_fb_pixel_lead','actions_lead'] },
  meta_aparelho: { accounts: BOTH, porConta: true, preset: 'last_90dT', fields: ['account_id','date','impression_device','spend','impressions','link_clicks'] },
  meta_conta: { accounts: BOTH, preset: 'last_7dT', fields: ['account_id','account_balance','amount_spent','spend_cap'] },
  meta_criativo: { accounts: BOTH, preset: 'last_90dT', fields: ['account_id','date','ad_id','reach','actions_landing_page_view','actions_video_view','video_p25_watched_actions_video_view','video_p50_watched_actions_video_view','video_p75_watched_actions_video_view','video_p100_watched_actions_video_view','video_thruplay_watched_actions_video_view','adset_daily_budget','campaign_daily_budget','effective_status'] },
  meta_fichas: { accounts: [ACC_MOOMBOX], preset: 'last_14dT', fields: ['ad_id','ad_name','adset_name','campaign','adset_targeting','adset_destination_type','adsset_optimization_goal','effective_status','ad_created_time','instagram_permalink_url','video_avg_time_watched_actions_video_view','spend'], filter: [['spend','gt',5]] },
  meta_hora: { accounts: BOTH, porConta: true, preset: 'last_90dT', fields: ['account_id','date','hourly_stats_aggregated_by_audience_time_zone','spend','impressions','link_clicks'] },
  meta_idade: { accounts: BOTH, preset: 'last_90dT', fields: ['account_id','date','age','spend','impressions','link_clicks'] },
  meta_plac: { accounts: BOTH, preset: 'last_90dT', fields: ['account_id','date','adset_name','ad_id','publisher_platform','platform_position','spend','impressions','link_clicks'] },
};

const AIRTABLE = {
  base: 'appJ6JOQgEdIDNnVJ',
  table: 'tblm3WZMjzes3aM5S',
  fields: ['fldGmvhtiErEDHSeo','fldFhpivgeWlIub5l','fldt8Pj7VHxWbbgDm','fldEdfZ5bPcKBGBHW','fldUJ54qkweyo7OPs','fld1SSKpuN5VrcImt','fldyMup9Yv7HAQaSZ','fld9NMnockPfCJZpC','fldkoenYwt0J9R1OL','fldaXA9qR2IBmRMjx'],
  dia: 'fldEdfZ5bPcKBGBHW',
  status: 'fldFhpivgeWlIub5l',
};

function autorizado(req) {
  const senha = process.env.PAINEL_SENHA;
  if (!senha) return true; // sem PAINEL_SENHA na Vercel = painel aberto
  const h = req.headers.authorization || '';
  if (h.startsWith('Basic ')) {
    const dec = Buffer.from(h.slice(6), 'base64').toString();
    if (dec.split(':').slice(1).join(':') === senha) return true;
  }
  return temCookie(req, senha);
}

const diaSP = (iso) => new Date(iso).toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });

async function airtable() {
  const key = process.env.AIRTABLE_TOKEN;
  if (!key) throw new Error('Falta a variável AIRTABLE_TOKEN na Vercel.');
  const records = [];
  let offset = '';
  for (let i = 0; i < 40; i++) {
    const u = new URL(`https://api.airtable.com/v0/${AIRTABLE.base}/${AIRTABLE.table}`);
    u.searchParams.set('returnFieldsByFieldId', 'true');
    u.searchParams.set('pageSize', '100');
    u.searchParams.set('filterByFormula', "IS_AFTER(CREATED_TIME(), DATEADD(TODAY(), -91, 'days'))");
    AIRTABLE.fields.forEach((f) => u.searchParams.append('fields[]', f));
    if (offset) u.searchParams.set('offset', offset);
    const r = await fetch(u, { headers: { Authorization: 'Bearer ' + key } });
    const j = await r.json();
    if (!r.ok) throw new Error('Airtable: ' + ((j.error && (j.error.message || j.error.type)) || r.status));
    for (const rec of j.records || []) {
      const c = Object.assign({}, rec.fields);
      if (c[AIRTABLE.dia]) c[AIRTABLE.dia] = diaSP(c[AIRTABLE.dia]);
      if (typeof c[AIRTABLE.status] === 'string') c[AIRTABLE.status] = { name: c[AIRTABLE.status] };
      records.push({ id: rec.id, createdTime: rec.createdTime, cellValuesByFieldId: c });
    }
    offset = j.offset;
    if (!offset) break;
  }
  records.sort((a, b) => String(b.createdTime).localeCompare(String(a.createdTime)));
  return { records };
}

async function windsor(cfg) {
  const key = process.env.WINDSOR_API_KEY;
  if (!key) throw new Error('Falta a variável WINDSOR_API_KEY na Vercel.');
  const u = new URL('https://connectors.windsor.ai/facebook');
  u.searchParams.set('api_key', key);
  u.searchParams.set('date_preset', cfg.preset);
  u.searchParams.set('fields', cfg.fields.join(','));
  u.searchParams.set('select_accounts', cfg.accounts.join(','));
  if (cfg.filter) u.searchParams.set('filter', JSON.stringify(cfg.filter));
  const r = await fetch(u);
  const txt = await r.text();
  let j;
  try { j = JSON.parse(txt); } catch (e) { throw new Error('Windsor respondeu algo inesperado (' + r.status + ').'); }
  if (!r.ok || j.error) throw new Error('Windsor: ' + (j.error || j.message || r.status));
  return { data: j.data || [] };
}

module.exports = async (req, res) => {
  if (!autorizado(req)) { res.status(401).json({ error: { message: 'Sem acesso' } }); return; }
  const id = String((req.query && req.query.id) || '');
  try {
    let out;
    if (id === 'leads') out = await airtable();
    else if (WINDSOR[id] && WINDSOR[id].porConta) {
      // Aparelho e hora voltam vazios quando as duas contas vão juntas: busca uma conta por vez e junta.
      const partes = await Promise.all(WINDSOR[id].accounts.map((a) => windsor(Object.assign({}, WINDSOR[id], { accounts: [a] })).catch(() => ({ data: [] }))));
      out = { data: partes.flatMap((p) => p.data) };
    } else if (WINDSOR[id]) out = await windsor(WINDSOR[id]);
    else { res.status(404).json({ error: { message: 'Fonte desconhecida: ' + id } }); return; }
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.status(200).json(out);
  } catch (e) {
    res.status(200).json({ error: { message: e.message || String(e) } });
  }
};

