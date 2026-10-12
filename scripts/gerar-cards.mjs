// node scripts/gerar-cards.mjs  →  assets/cards/*.svg (capa, um cartão por projeto, atividade, sinais)
// Substitui o GitSkins: os cartões são NOSSOS, com dados reais da API do GitHub, e cada projeto é um arquivo
// separado para poder ter o próprio link no README (link dentro de SVG não funciona no GitHub).
// Precisa de GITHUB_TOKEN (na Action vem sozinho; no PC: GITHUB_TOKEN=$(gh auth token)). Sem dependências.
import fs from 'node:fs';
import path from 'node:path';

const LOGIN = 'Victor-Enginner';
const RAIZ = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..');
const SAIDA = path.join(RAIZ, 'assets/cards');
const PROJETOS = JSON.parse(fs.readFileSync(path.join(RAIZ, 'scripts/projetos.json'), 'utf8'));
const TOKEN = process.env.GITHUB_TOKEN;
if (!TOKEN) { console.error('falta GITHUB_TOKEN'); process.exit(1); }

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
async function gql(query, variables = {}) {
  const r = await fetch('https://api.github.com/graphql', { method: 'POST', headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ query, variables }) });
  const j = await r.json();
  if (j.errors) throw new Error(JSON.stringify(j.errors));
  return j.data;
}
const dataUri = async (url, tipo) => `data:${tipo};base64,${Buffer.from(await (await fetch(url)).arrayBuffer()).toString('base64')}`;
// quebra o texto em linhas de até `n` caracteres, no máximo `max` linhas
function quebrar(t, n, max) {
  const linhas = [''];
  for (const p of String(t || '').split(/\s+/)) {
    if ((linhas.at(-1) + ' ' + p).trim().length > n) { if (linhas.length === max) { linhas[max - 1] = linhas[max - 1].replace(/\s*\S*$/, '…'); break; } linhas.push(p); }
    else linhas[linhas.length - 1] = (linhas.at(-1) + ' ' + p).trim();
  }
  return linhas;
}
function haQuanto(iso) {
  const d = Math.floor((Date.now() - Date.parse(iso)) / 86_400_000);
  return d <= 0 ? 'hoje' : d === 1 ? 'ontem' : d < 30 ? `há ${d} dias` : d < 365 ? `há ${Math.floor(d / 30)} meses` : `há ${Math.floor(d / 365)} anos`;
}

// ---------- visual comum (verde neon, vidro escuro)
const FONTE = "'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
const MONO = "'JetBrains Mono', 'Cascadia Code', Consolas, monospace";
// Fundo de vidro: manchas de luz desfocadas que flutuam devagar atrás de um painel translúcido, reflexo no topo
// e um brilho que percorre a borda. Tudo em SVG puro (SMIL), que o GitHub anima dentro de <img>.
const mancha = (cx, cy, r, cor, op, dx, dy, dur) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${cor}" opacity="${op}" class="flutua">
    <animateTransform attributeName="transform" type="translate" values="0 0; ${dx} ${dy}; 0 0" dur="${dur}s" repeatCount="indefinite"/></circle>`;
const fundo = (w, h, id) => `
  <defs>
    <filter id="${id}blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${Math.round(Math.min(w, h) / 5)}"/></filter>
    <clipPath id="${id}clip"><rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="22"/></clipPath>
    <linearGradient id="${id}borda" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#bbf7d0" stop-opacity=".75"/><stop offset=".35" stop-color="#22c55e" stop-opacity=".35"/><stop offset="1" stop-color="#22c55e" stop-opacity=".1"/></linearGradient>
    <linearGradient id="${id}vidro" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".09"/><stop offset=".4" stop-color="#ffffff" stop-opacity=".025"/><stop offset="1" stop-color="#ffffff" stop-opacity=".01"/></linearGradient>
    <linearGradient id="${id}brilho" gradientUnits="userSpaceOnUse" x1="${-w}" y1="0" x2="0" y2="0">
      <stop offset="0" stop-color="#22c55e" stop-opacity="0"/><stop offset=".5" stop-color="#d9f99d" stop-opacity=".95"/><stop offset="1" stop-color="#22c55e" stop-opacity="0"/>
      <animate attributeName="x1" values="${-w};${w}" dur="6s" repeatCount="indefinite"/><animate attributeName="x2" values="0;${w * 2}" dur="6s" repeatCount="indefinite"/>
    </linearGradient>
  </defs>
  <g clip-path="url(#${id}clip)">
    <rect width="${w}" height="${h}" fill="#020a05"/>
    <g filter="url(#${id}blur)">
      ${mancha(w * 0.12, 0, h * 0.75, '#16ff5c', 0.75, w * 0.08, h * 0.12, 14)}
      ${mancha(w * 0.62, h * 0.05, h * 0.6, '#059669', 0.55, -w * 0.06, h * 0.1, 18)}
      ${mancha(w * 0.5, h * 1.05, h * 0.55, '#a3e635', 0.45, w * 0.1, -h * 0.08, 16)}
      ${mancha(w * 0.98, h, h * 0.55, '#4338ca', 0.6, -w * 0.05, -h * 0.1, 20)}
    </g>
  </g>
  <rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="22" fill="none" stroke="url(#${id}borda)" stroke-width="1.2"/>
  <rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="22" fill="none" stroke="url(#${id}brilho)" stroke-width="1.6" class="flutua"/>
  <rect x="20" y="20" width="${w - 40}" height="${h - 40}" rx="16" fill="#03140a" fill-opacity=".42"/>
  <rect x="20" y="20" width="${w - 40}" height="${h - 40}" rx="16" fill="url(#${id}vidro)" stroke="url(#${id}borda)" stroke-width="1"/>
  <path d="M36 21 H${w - 36}" stroke="#ecfccb" stroke-opacity=".35" stroke-width="1"/>`;
const CSS = `<style>
  .t{font-family:${FONTE};fill:#22c55e}.m{font-family:${MONO};fill:#86efac}.s{fill:#4ade80}
  .pisca{animation:p 1.1s steps(1) infinite}@keyframes p{50%{opacity:0}}
  @media (prefers-reduced-motion: reduce){.pisca{animation:none!important}.anda,.flutua animate,.flutua animateTransform{display:none}}
</style>`;
const svg = (w, h, corpo, titulo) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(titulo)}"><title>${esc(titulo)}</title>${CSS}${corpo}</svg>\n`;

// ---------- dados
const { user: u } = await gql(`query($l:String!){ user(login:$l){
  name login avatarUrl(size:200) followers{totalCount}
  repositories(ownerAffiliations:OWNER, privacy:PUBLIC, first:100){ totalCount nodes{ stargazerCount primaryLanguage{name} isFork } }
  contributionsCollection{ contributionCalendar{ totalContributions weeks{ contributionDays{ contributionCount date } } } } } }`, { l: LOGIN });
const estrelas = u.repositories.nodes.reduce((s, r) => s + r.stargazerCount, 0);
const linguagens = Object.entries(u.repositories.nodes.filter((r) => !r.isFork && r.primaryLanguage).reduce((a, r) => ((a[r.primaryLanguage.name] = (a[r.primaryLanguage.name] || 0) + 1), a), {}))
  .sort((a, b) => b[1] - a[1]).slice(0, 4).map(([n]) => n);
const cal = u.contributionsCollection.contributionCalendar;
fs.mkdirSync(SAIDA, { recursive: true });
const gravar = (nome, conteudo) => { fs.writeFileSync(path.join(SAIDA, nome), conteudo); console.log(`${nome} · ${(conteudo.length / 1024).toFixed(0)} KB`); };

// ---------- 1. capa
{
  const W = 880, H = 240, avatar = await dataUri(u.avatarUrl, 'image/png');
  let x = 210;
  const chips = linguagens.map((l) => { const w = 18 + l.length * 8.2; const c = `<rect x="${x}" y="164" width="${w}" height="28" rx="14" fill="#03150a" stroke="#22c55e" stroke-opacity=".6"/><text class="t" x="${x + w / 2}" y="183" font-size="12.5" font-weight="700" text-anchor="middle">${esc(l)}</text>`; x += w + 12; return c; }).join('');
  gravar('capa.svg', svg(W, H, `${fundo(W, H, 'h')}
    <clipPath id="av"><circle cx="112" cy="120" r="60"/></clipPath>
    <circle cx="112" cy="120" r="64" fill="none" stroke="#22c55e" stroke-width="3"/><image href="${avatar}" x="52" y="60" width="120" height="120" clip-path="url(#av)"/>
    <text class="m" x="210" y="80" font-size="14" font-weight="700" letter-spacing="2">@${esc(u.login.toLowerCase())}</text>
    <path d="M210 88 Q 330 74 450 86" fill="none" stroke="#22c55e" stroke-opacity=".5"/>
    <text class="t" x="208" y="132" font-size="46" font-weight="800">${esc(u.name)}</text>
    <text class="s" x="210" y="152" font-family="${FONTE}" font-size="14" opacity=".9">Engenharia de IA · agentes locais · sistemas que funcionam</text>
    ${chips}<circle class="pisca" cx="830" cy="58" r="5" fill="#22c55e"/>`, `${u.name} — @${u.login}`));
}

// ---------- 2. um cartão por projeto (com print do site quando existe)
for (const p of PROJETOS) {
  const { repository: r } = await gql(`query($o:String!,$n:String!){ repository(owner:$o,name:$n){ stargazerCount pushedAt description primaryLanguage{name color} } }`, { o: LOGIN, n: p.repo });
  const W = 430, H = p.print ? 400 : 230, topo = p.print ? 200 : 40;
  const imagem = p.print ? `<clipPath id="pc"><rect x="36" y="58" width="${W - 72}" height="${topo - 70}" rx="10"/></clipPath>
    <image href="data:image/jpeg;base64,${fs.readFileSync(path.join(RAIZ, p.print)).toString('base64')}" x="36" y="58" width="${W - 72}" height="${topo - 70}" preserveAspectRatio="xMidYMin slice" clip-path="url(#pc)"/>
    <rect x="36" y="58" width="${W - 72}" height="${topo - 70}" rx="10" fill="none" stroke="#22c55e" stroke-opacity=".4"/>` : '';
  const desc = quebrar(p.descricao || r.description, 44, 3).map((l, i) => `<text class="m" x="44" y="${topo + 62 + i * 18}" font-size="12.5" fill="#bbf7d0">${esc(l)}</text>`).join('');
  const lang = r.primaryLanguage ? `<circle cx="48" cy="${H - 46}" r="5" fill="${r.primaryLanguage.color || '#22c55e'}"/><text class="m" x="58" y="${H - 42}" font-size="12">${esc(r.primaryLanguage.name)}</text>` : '';
  gravar(`projeto-${p.repo.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.svg`, svg(W, H, `${fundo(W, H, 'p')}
    <text class="m" x="44" y="44" font-size="12" font-weight="700">● ${esc(p.repo)}</text><text class="m" x="${W - 44}" y="44" font-size="12" font-weight="700" text-anchor="end" fill="#a3e635">${p.site ? "abrir site ↗" : "ver código ↗"}</text>
    ${imagem}
    <text class="t" x="44" y="${topo + 36}" font-size="21" font-weight="800">${esc(p.titulo)}<tspan class="pisca"> _</tspan></text>
    ${desc}${lang}
    <text class="m" x="${r.primaryLanguage ? 58 + r.primaryLanguage.name.length * 7.6 + 16 : 44}" y="${H - 42}" font-size="12">★ ${r.stargazerCount} · atualizado ${haQuanto(r.pushedAt)}</text>`, `${p.titulo} — ${p.descricao || r.description || ''}`));
}

// ---------- 3. atividade: o calendário real + a cobrinha que percorre os dias com commit
{
  const semanas = cal.weeks, C = 12, G = 3, X0 = 44, Y0 = 96;
  const W = X0 * 2 + semanas.length * (C + G), H = Y0 + 7 * (C + G) + 44;
  const max = Math.max(1, ...semanas.flatMap((s) => s.contributionDays.map((d) => d.contributionCount)));
  const tom = (n) => (n === 0 ? '#0b1f12' : ['#14532d', '#15803d', '#22c55e', '#4ade80'][Math.min(3, Math.floor((n / max) * 4))]);
  // A cobra anda em zigue-zague pela grade inteira (desce uma semana, sobe a próxima). Cada dia com contribuição
  // acende no instante em que a cabeça passa por ele — ela "come" o seu histórico.
  const ordem = [];
  semanas.forEach((s, i) => {
    const dias = s.contributionDays.map((d, j) => ({ d, i, j }));
    (i % 2 ? dias.reverse() : dias).forEach((c) => ordem.push(c));
  });
  const PASSO = 0.07, T = +(ordem.length * PASSO).toFixed(2);
  const centro = ({ i, j }) => [X0 + i * (C + G) + C / 2, Y0 + j * (C + G) + C / 2];
  const caminho = `M${ordem.map((c) => centro(c).join(' ')).join(' L')}`;
  const celulas = ordem.map((c, k) => {
    const [cx, cy] = centro(c), n = c.d.contributionCount, base = tom(n);
    const t = (k * PASSO) / T, t2 = Math.min(1, t + 1.6 / T);
    const come = n ? `<animate class="anda" attributeName="fill" values="${base};${base};#ecfccb;${base};${base}" keyTimes="0;${t.toFixed(4)};${Math.min(t + 0.002, 1).toFixed(4)};${t2.toFixed(4)};1" dur="${T}s" repeatCount="indefinite"/>` : '';
    return `<rect x="${cx - C / 2}" y="${cy - C / 2}" width="${C}" height="${C}" rx="3" fill="${base}"><title>${c.d.date}: ${n}</title>${come}</rect>`;
  }).join('');
  // corpo: cada gomo fica d segundos atrás da cabeça (começar em -(T-d) põe ele no ponto certo já no 1º quadro)
  const gomo = (k) => { const d = (k * 0.055).toFixed(3), r = Math.max(2.4, 5.2 - k * 0.38);
    return `<circle class="anda" r="${r}" fill="#4ade80" opacity="${(0.95 - k * 0.09).toFixed(2)}"><animateMotion dur="${T}s" begin="${k ? -(T - d) : 0}s" repeatCount="indefinite" path="${caminho}"/></circle>`; };
  const cobra = `${[8, 7, 6, 5, 4, 3, 2, 1].map(gomo).join('')}
    <g class="anda"><animateMotion dur="${T}s" repeatCount="indefinite" rotate="auto" path="${caminho}"/>
      <circle r="9" fill="#bbf7d0" opacity=".35"/><rect x="-6.5" y="-6.5" width="13" height="13" rx="4.5" fill="#d9f99d"/>
      <circle cx="2.4" cy="-2.6" r="1.6" fill="#052e16"/><circle cx="2.4" cy="2.6" r="1.6" fill="#052e16"/></g>`;
  gravar('atividade.svg', svg(W, H, `${fundo(W, H, 'a')}
    <text class="m" x="${X0}" y="56" font-size="12" font-weight="700" letter-spacing="3">RASTRO DE CONTRIBUIÇÕES</text>
    <text class="t" x="${X0}" y="80" font-size="19" font-weight="800">${cal.totalContributions} contribuições no último ano</text>
    <text class="m" x="${W - X0}" y="56" font-size="11" font-weight="700" text-anchor="end" fill="#a3e635">AO VIVO</text>
    ${celulas}${cobra}`, `${cal.totalContributions} contribuições no último ano`));
}

// ---------- 4. sinais
{
  const W = 880, H = 190;
  const itens = [['Estrelas', estrelas, '#22ff6a'], ['Contribuições', cal.totalContributions, '#6d5bff'], ['Repositórios', u.repositories.totalCount, '#d9f99d'], ['Seguidores', u.followers.totalCount, '#2dd4bf']];
  const maior = Math.max(...itens.map((i) => i[1]), 1);
  const blocos = itens.map(([n, v, cor], i) => { const x = 40 + i * 202;
    return `<rect x="${x}" y="70" width="190" height="96" rx="14" fill="#020604" stroke="#22c55e" stroke-opacity=".35"/>
      <text class="t" x="${x + 18}" y="96" font-size="12" font-weight="700" fill="#86efac">${n}</text>
      <text x="${x + 18}" y="136" font-family="${FONTE}" font-size="32" font-weight="800" fill="${cor}">${v}</text>
      <rect x="${x + 18}" y="148" width="154" height="6" rx="3" fill="#0b1f12"/><rect x="${x + 18}" y="148" width="${Math.max(6, (v / maior) * 154)}" height="6" rx="3" fill="${cor}"/>`; }).join('');
  gravar('sinais.svg', svg(W, H, `${fundo(W, H, 's')}
    <text class="t" x="40" y="54" font-size="22" font-weight="800">Sinais do perfil</text>
    <text class="m" x="${W - 40}" y="54" font-size="11" text-anchor="end">dados reais da API do GitHub · atualizado todo dia</text>${blocos}`, 'Sinais do perfil'));
}

// ---------- 5. contato: um botão de vidro por destino (cada um com o próprio link no README)
for (const [arq, rotulo, valor, sigla] of [
  ['contato-github', 'GitHub', '@victor-enginner', 'GH'],
  ['contato-site', 'Site', 'victor-ai-enginner.vercel.app', 'VA'],
  ['contato-hub', 'Victor Hub AI', 'victor-hub-ai.vercel.app', 'HB'],
  ['contato-portfolio', 'Portfólio', 'Victor-Enginner/Portf-lio', 'PF'],
]) {
  const W = 360, H = 92;
  gravar(`${arq}.svg`, svg(W, H, `${fundo(W, H, arq.slice(-3))}
    <circle cx="58" cy="46" r="17" fill="#03140a" stroke="#86efac" stroke-opacity=".7"/>
    <text class="t" x="58" y="51" font-size="12" font-weight="800" text-anchor="middle" fill="#d9f99d">${sigla}</text>
    <text class="m" x="88" y="40" font-size="11" font-weight="700" letter-spacing="1.5">${esc(rotulo.toUpperCase())}</text>
    <text class="t" x="88" y="60" font-size="14" font-weight="700">${esc(valor)}</text>
    <text class="m" x="${W - 40}" y="51" font-size="14" text-anchor="end" fill="#a3e635">↗</text>`, `${rotulo}: ${valor}`));
}
