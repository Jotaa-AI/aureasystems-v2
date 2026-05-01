#!/usr/bin/env node
/**
 * Generador de posts del blog vía Claude API.
 *
 * Llamado desde GitHub Actions cada lunes/jueves a las 9:00 Madrid.
 * Se ejecuta en el runner de GH Actions (red abierta, distinto del CCR).
 *
 * Output: variables al GITHUB_OUTPUT con el resultado para los siguientes
 * steps del workflow (que crean rama, commitean, abren PR, notifican Telegram).
 *
 * Variables de entorno requeridas:
 *   ANTHROPIC_API_KEY  — clave de la API de Claude
 *   GITHUB_OUTPUT      — provisto por GH Actions
 */

import { readdir, readFile, writeFile, appendFile } from 'node:fs/promises';
import { join } from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import matter from 'gray-matter';

const ROOT = process.cwd();
const POSTS_DIR = join(ROOT, 'content/posts');
const AUTHORS_DIR = join(ROOT, 'content/authors');
const AGENT_DIR = join(ROOT, 'agent');

const MODEL = process.env.MODEL || 'claude-sonnet-4-5-20250929';
const MAX_TOKENS = 16000;

// --- Helpers ---
async function loadAgentContext() {
  const [instructions, topicBank] = await Promise.all([
    readFile(join(AGENT_DIR, 'INSTRUCTIONS.md'), 'utf8'),
    readFile(join(AGENT_DIR, 'TOPIC_BANK.md'), 'utf8'),
  ]);

  // Lista de posts existentes (sólo títulos + slugs, no body completo)
  const postFiles = (await readdir(POSTS_DIR)).filter(f => f.endsWith('.md')).sort().reverse();
  const allPostsIndex = [];
  const recentPostsFull = [];

  for (let i = 0; i < postFiles.length; i++) {
    const raw = await readFile(join(POSTS_DIR, postFiles[i]), 'utf8');
    const { data } = matter(raw);
    allPostsIndex.push({
      file: postFiles[i],
      slug: data.slug,
      title: data.title,
      author: data.author,
      category: data.category,
      date: data.date,
    });
    if (i < 3) recentPostsFull.push({ file: postFiles[i], raw });
  }

  const authors = {};
  for (const f of (await readdir(AUTHORS_DIR)).filter(f => f.endsWith('.json'))) {
    const data = JSON.parse(await readFile(join(AUTHORS_DIR, f), 'utf8'));
    authors[data.id] = data;
  }

  return { instructions, topicBank, allPostsIndex, recentPostsFull, authors };
}

function buildSystemPrompt(ctx) {
  return [
    `Eres el agente generador de artículos del blog de Aurea Systems.`,
    `Sigues literalmente el manual que viene en INSTRUCTIONS.md, sin interpretar libremente.`,
    `Tu output es estructurado: SOLO un bloque JSON con la estructura exacta indicada al final.`,
    ``,
    `=== INSTRUCTIONS.md (manual completo) ===`,
    ctx.instructions,
    ``,
    `=== TOPIC_BANK.md (banco de temas) ===`,
    ctx.topicBank,
    ``,
    `=== POSTS YA PUBLICADOS (índice — NO repetir slug ni tema) ===`,
    ctx.allPostsIndex.map(p =>
      `- ${p.date} | ${p.author} | ${p.category} | ${p.title} | slug=${p.slug}`).join('\n'),
    ``,
    `=== 3 POSTS MÁS RECIENTES (íntegros, para referencia de tono y estructura) ===`,
    ctx.recentPostsFull.map(p => `--- ${p.file} ---\n${p.raw}`).join('\n\n'),
    ``,
    `=== AUTORES ===`,
    JSON.stringify(ctx.authors, null, 2),
  ].join('\n');
}

function buildUserPrompt(today) {
  return [
    `Genera UN artículo nuevo para hoy (${today}) siguiendo el manual.`,
    ``,
    `Pasos que debes hacer mentalmente:`,
    `1. Mira el último post publicado y aplica alternancia de autor (Joel ↔ Lluc).`,
    `2. **Lluc → Marketing** (Captación, Anuncios, Redes Sociales, Conversión, Retención).`,
    `   **Joel → Tecnología/IA** (IA conversacional, Automatización, Software, Datos, Operaciones con IA).`,
    `3. Elige un tema del TOPIC_BANK con mayor priority dentro del área del autor que toca,`,
    `   que esté con status=pending. Si no hay, propón uno nuevo coherente.`,
    `4. Genera el artículo aplicando TODAS las reglas (1000-1800 palabras, ≥3 H2, ≥3 FAQs,`,
    `   ≥1 enlace interno, tuteo, datos concretos, B2B, sin afirmaciones terapéuticas).`,
    `5. Genera el TOPIC_BANK actualizado: marca el tema usado como 'used', con used_date y used_in.`,
    ``,
    `Imagen de portada: usa una URL de Unsplash con este patrón si conoces una apropiada:`,
    `  https://images.unsplash.com/photo-{ID}?w=1600&q=80&auto=format&fit=crop`,
    `Si no estás seguro de un photo ID que exista, usa:`,
    `  https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1600&q=80&auto=format&fit=crop`,
    `(es una foto neutra de clínica que ya usamos antes — el humano la cambiará en revisión si quiere).`,
    ``,
    `=== FORMATO DE SALIDA — OBLIGATORIO ===`,
    ``,
    `Devuelve SOLO un bloque \`\`\`json\`\`\` con esta forma exacta:`,
    ``,
    `\`\`\`json`,
    `{`,
    `  "title": "Título del post (60-65 chars)",`,
    `  "description": "Meta descripción 140-160 chars",`,
    `  "slug": "url-slug-corto",`,
    `  "category": "Marketing|Captación|Branding|Redes Sociales|Conversión|IA|Tecnología|Automatización|Datos|Herramientas",`,
    `  "date": "${today}",`,
    `  "author": "joel" | "lluc",`,
    `  "cover_url": "https://images.unsplash.com/photo-...",`,
    `  "cover_alt": "Descripción para alt",`,
    `  "cover_caption": "Foto: Unsplash. Caption corto",`,
    `  "faq": [`,
    `    { "q": "Pregunta 1", "a": "Respuesta 1" },`,
    `    { "q": "Pregunta 2", "a": "Respuesta 2" },`,
    `    { "q": "Pregunta 3", "a": "Respuesta 3" }`,
    `  ],`,
    `  "related": [],`,
    `  "body_markdown": "Cuerpo del artículo en Markdown sin frontmatter — empieza por el lead, luego ## H2, etc.",`,
    `  "topic_bank_updated": "CONTENIDO COMPLETO del TOPIC_BANK.md actualizado, con el tema usado marcado como status=used",`,
    `  "pr_summary": {`,
    `    "keyword": "keyword principal",`,
    `    "intent": "informacional|comparativa|transaccional",`,
    `    "justification": "2-3 frases sobre por qué este tema posiciona y por qué encaja ahora",`,
    `    "sources": ["url1", "url2"]`,
    `  }`,
    `}`,
    `\`\`\``,
    ``,
    `Nada antes ni después del bloque JSON. Sin comentarios.`,
  ].join('\n');
}

function parseJsonResponse(text) {
  // Extrae el bloque ```json ... ``` o el primer JSON balanceado
  const m = text.match(/```json\s*([\s\S]*?)```/);
  let raw = m ? m[1] : text;
  raw = raw.trim();
  if (!raw.startsWith('{')) {
    const idx = raw.indexOf('{');
    if (idx === -1) throw new Error('No JSON in response');
    raw = raw.slice(idx);
  }
  return JSON.parse(raw);
}

function validateOutput(o) {
  const errs = [];
  const must = ['title', 'description', 'slug', 'category', 'date', 'author',
                'cover_url', 'cover_alt', 'faq', 'body_markdown', 'topic_bank_updated', 'pr_summary'];
  for (const k of must) if (!o[k]) errs.push(`falta ${k}`);
  if (o.title && o.title.length > 75) errs.push(`título demasiado largo (${o.title.length})`);
  if (o.description && (o.description.length < 130 || o.description.length > 175)) errs.push(`descripción fuera de rango (${o.description.length})`);
  if (o.author && !['joel', 'lluc'].includes(o.author)) errs.push(`author inválido: ${o.author}`);
  if (o.faq && o.faq.length < 3) errs.push(`menos de 3 FAQs (${o.faq.length})`);
  if (o.body_markdown) {
    const wc = o.body_markdown.split(/\s+/).filter(Boolean).length;
    if (wc < 900 || wc > 2200) errs.push(`word count fuera de rango (${wc})`);
    const h2 = (o.body_markdown.match(/^##\s/gm) || []).length;
    if (h2 < 3) errs.push(`menos de 3 H2 (${h2})`);
  }
  return errs;
}

function buildFrontmatterMd(o) {
  // Construye el .md final con frontmatter completo
  const fm = {
    title: o.title,
    description: o.description,
    slug: o.slug,
    category: o.category,
    date: o.date,
    author: o.author,
    cover: o.cover_url,
    cover_alt: o.cover_alt,
    cover_caption: o.cover_caption || null,
    toc: true,
    faq: o.faq,
    related: o.related || [],
  };
  return matter.stringify(o.body_markdown.trim() + '\n', fm);
}

function buildPrBody(o, ctx) {
  const author = ctx.authors[o.author];
  const wc = o.body_markdown.split(/\s+/).filter(Boolean).length;
  const rt = Math.max(1, Math.round(wc / 220));
  const sources = (o.pr_summary?.sources || []).map(s => `- ${s}`).join('\n') || '- (no se citaron fuentes externas)';

  return `## Resumen

- **Título**: ${o.title}
- **Autor**: ${author?.name || o.author}
- **Categoría**: ${o.category}
- **Keyword principal**: ${o.pr_summary?.keyword || '—'}
- **Intención de búsqueda**: ${o.pr_summary?.intent || '—'}
- **Tiempo de lectura**: ${rt} min
- **Palabras**: ${wc}

## Por qué este tema

${o.pr_summary?.justification || '—'}

## Fuentes consultadas

${sources}

## Checklist humano antes de mergear

- [ ] Datos numéricos del artículo coinciden con realidad / fuentes
- [ ] No hay afirmaciones terapéuticas dirigidas al paciente
- [ ] Imagen de portada apropiada
- [ ] Enlaces internos funcionan
- [ ] FAQ tiene sentido y aporta
- [ ] El cierre/CTA suena natural

🤖 Generado automáticamente por GitHub Actions \`generate-blog-post.yml\``;
}

async function ghOutput(key, value) {
  if (!process.env.GITHUB_OUTPUT) {
    console.log(`${key}=${value}`);
    return;
  }
  // Multilínea con delimitador para variables grandes
  const delim = `EOF_${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
  await appendFile(process.env.GITHUB_OUTPUT, `${key}<<${delim}\n${value}\n${delim}\n`);
}

// --- Main ---
async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) { console.error('Falta ANTHROPIC_API_KEY'); process.exit(1); }

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  console.log(`🗓️  Generando artículo para ${today}`);

  console.log('📚 Cargando contexto del repo...');
  const ctx = await loadAgentContext();
  console.log(`   ${ctx.allPostsIndex.length} posts existentes, autores: ${Object.keys(ctx.authors).join(', ')}`);

  const client = new Anthropic({ apiKey });

  console.log(`🤖 Llamando a Claude (${MODEL})...`);
  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: buildSystemPrompt(ctx),
    messages: [{ role: 'user', content: buildUserPrompt(today) }],
  });

  const text = resp.content.filter(c => c.type === 'text').map(c => c.text).join('\n');
  console.log(`📝 Respuesta recibida (${text.length} chars, stop_reason: ${resp.stop_reason})`);

  let parsed;
  try {
    parsed = parseJsonResponse(text);
  } catch (e) {
    console.error('❌ JSON inválido en la respuesta:');
    console.error(text.slice(0, 500));
    process.exit(2);
  }

  const errs = validateOutput(parsed);
  if (errs.length) {
    console.error('❌ Validación falló:');
    for (const e of errs) console.error(`   - ${e}`);
    process.exit(3);
  }
  console.log('✅ Output válido');

  // Construye los archivos finales
  const postPath = `content/posts/${today}-${parsed.slug}.md`;
  const postContent = buildFrontmatterMd(parsed);
  const branchName = `post/${today}-${parsed.slug}`;
  const wc = parsed.body_markdown.split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.round(wc / 220));
  const author = ctx.authors[parsed.author];
  const prTitle = `Post: ${parsed.title}`;
  const prBody = buildPrBody(parsed, ctx);
  const commitMessage = `Nuevo post: ${parsed.title}`;

  // Escribe los dos archivos en el workspace
  await writeFile(join(ROOT, postPath), postContent);
  await writeFile(join(AGENT_DIR, 'TOPIC_BANK.md'), parsed.topic_bank_updated);
  console.log(`✅ Archivos escritos: ${postPath} + agent/TOPIC_BANK.md`);

  // Pasa metadata al workflow vía GITHUB_OUTPUT
  await ghOutput('branch_name', branchName);
  await ghOutput('post_path', postPath);
  await ghOutput('commit_message', commitMessage);
  await ghOutput('pr_title', prTitle);
  await ghOutput('pr_body', prBody);
  await ghOutput('title', parsed.title);
  await ghOutput('description', parsed.description);
  await ghOutput('slug', parsed.slug);
  await ghOutput('category', parsed.category);
  await ghOutput('author_name', author?.name || parsed.author);
  await ghOutput('cover_url', parsed.cover_url);
  await ghOutput('reading_time', String(readingTime));
  await ghOutput('word_count', String(wc));

  console.log(`\n📊 Resumen:`);
  console.log(`   Título: ${parsed.title}`);
  console.log(`   Autor: ${author?.name || parsed.author}`);
  console.log(`   Categoría: ${parsed.category}`);
  console.log(`   Palabras: ${wc} · Tiempo lectura: ${readingTime} min`);
  console.log(`   Branch: ${branchName}`);
}

main().catch(e => { console.error(e); process.exit(1); });
