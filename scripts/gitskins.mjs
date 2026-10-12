// node scripts/gitskins.mjs  →  assets/gitskins/*.svg
// Baixa os desenhos ORIGINAIS do GitSkins (o visual que o Victor escolheu) e guarda no repositório, para:
//  1. o clique levar ao link que NÓS definimos (imagem externa abre a página do proxy do GitHub);
//  2. não depender do GitSkins no ar;
//  3. acrescentar na capa uma rede de neurônios pulsando — sem mexer em nada do desenho original.
// Roda todo dia pela Action (dados atualizados). Sem dependências.
import fs from 'node:fs';
import path from 'node:path';

const RAIZ = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..');
const SAIDA = path.join(RAIZ, 'assets/gitskins');
const AVATAR = 'https%3A%2F%2Favatars.githubusercontent.com%2Fu%2F295998838%3Fu%3D45a476928973291ad4e44c611881b74c0db98bd0%26v%3D4';
const SECOES = { hero: 'aura', heatmap: 'snake', stats: 'aura', social: 'aura' };
fs.mkdirSync(SAIDA, { recursive: true });

// Rede de neurônios determinística (mesma semente = mesmo desenho todo dia, sem "pular" no perfil).
function redeNeural({ x0, y0, w, h, nos = 46, alcance = 112, semente = 7 }) {
  let s = semente;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const pts = Array.from({ length: nos }, () => [x0 + rnd() * w, y0 + rnd() * h, rnd()]);
  const arestas = [];
  pts.forEach((a, i) => pts.slice(i + 1).forEach((b, k) => {
    const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
    if (d < alcance) arestas.push([i, i + 1 + k, d]);
  }));
  const f = (n) => n.toFixed(1);
  const linhas = arestas.map(([i, j, d], n) => {
    const op = (0.32 * (1 - d / alcance) + 0.05).toFixed(2), dur = (3 + rnd() * 4).toFixed(1);
    return `<line x1="${f(pts[i][0])}" y1="${f(pts[i][1])}" x2="${f(pts[j][0])}" y2="${f(pts[j][1])}" stroke="#22c55e" stroke-width=".7" opacity="${op}">
      <animate attributeName="opacity" values="${op};${(op * 2.4).toFixed(2)};${op}" dur="${dur}s" begin="${(rnd() * 4).toFixed(1)}s" repeatCount="indefinite"/></line>`;
  }).join('');
  const neuronios = pts.map(([x, y, z]) => {
    const r = (0.9 + z * 1.6).toFixed(1), dur = (2 + rnd() * 3).toFixed(1);
    return `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="#00ff00" opacity=".55">
      <animate attributeName="r" values="${r};${(r * 1.9).toFixed(1)};${r}" dur="${dur}s" begin="${(rnd() * 3).toFixed(1)}s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values=".35;.95;.35" dur="${dur}s" begin="${(rnd() * 3).toFixed(1)}s" repeatCount="indefinite"/></circle>`;
  }).join('');
  // impulsos: pontos de luz que correm por algumas sinapses, como sinal entre neurônios
  const impulsos = arestas.filter(() => rnd() < 0.22).map(([i, j]) =>
    `<circle r="1.6" fill="#b6ff9e"><animateMotion dur="${(1.4 + rnd() * 2.2).toFixed(1)}s" begin="${(rnd() * 5).toFixed(1)}s" repeatCount="indefinite" path="M${f(pts[i][0])} ${f(pts[i][1])} L${f(pts[j][0])} ${f(pts[j][1])}"/>
      <animate attributeName="opacity" values="0;1;0" dur="${(1.4 + rnd() * 2.2).toFixed(1)}s" repeatCount="indefinite"/></circle>`).join('');
  // poeira de estrelas ao fundo
  const estrelas = Array.from({ length: 70 }, () => {
    const x = x0 + rnd() * w, y = y0 + rnd() * h, d = (1.5 + rnd() * 3).toFixed(1);
    return `<circle cx="${f(x)}" cy="${f(y)}" r="${(0.3 + rnd() * 0.6).toFixed(2)}" fill="#d9ffd0" opacity=".4"><animate attributeName="opacity" values=".1;.7;.1" dur="${d}s" begin="${(rnd() * 3).toFixed(1)}s" repeatCount="indefinite"/></circle>`;
  }).join('');
  return `<g class="rede-neural" aria-hidden="true"><style>@media (prefers-reduced-motion: reduce){.rede-neural animate,.rede-neural animateMotion{display:none}}</style>${estrelas}${linhas}${neuronios}${impulsos}</g>`;
}

for (const [secao, estilo] of Object.entries(SECOES)) {
  const url = `https://www.gitskins.com/api/section/${secao}?username=victor-enginner&theme=matrix&style=${estilo}&avatar=${AVATAR}`;
  const r = await fetch(url);
  let svg = await r.text();
  if (!r.ok || !svg.includes('<svg')) { console.error(`${secao}: GitSkins não respondeu (${r.status}); mantive o arquivo anterior`); continue; }
  if (secao === 'hero') {
    // entra logo depois do painel interno (x=26,y=26) e antes da foto e do nome
    const painel = svg.match(/<rect x="26" y="26" width="(\d+)" height="(\d+)"[^>]*\/>/);
    if (painel) svg = svg.replace(painel[0], painel[0] + redeNeural({ x0: 34, y0: 32, w: +painel[1] - 16, h: +painel[2] - 12 }));
    else console.error('hero: não achei o painel interno; publiquei sem a rede neural');
  }
  fs.writeFileSync(path.join(SAIDA, `${secao}.svg`), svg);
  console.log(`${secao}.svg · ${(svg.length / 1024).toFixed(0)} KB`);
}
