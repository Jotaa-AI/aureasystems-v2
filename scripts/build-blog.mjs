#!/usr/bin/env node
/**
 * Generador estático del blog de Aurea Systems.
 * Lee Markdown de /content/posts, plantillas de /templates,
 * y produce HTML, sitemap, robots, llms.txt y RSS en /dist-blog.
 */

import { readdir, readFile, writeFile, mkdir, rm, stat, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import MarkdownIt from 'markdown-it';
import slugify from 'slugify';

// --- Paths ---
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const POSTS_DIR = join(ROOT, 'content/posts');
const AUTHORS_DIR = join(ROOT, 'content/authors');
const TEMPLATES_DIR = join(ROOT, 'templates');
const PARTIALS_DIR = join(TEMPLATES_DIR, 'partials');
const OUT_DIR = join(ROOT, 'dist-blog');
const OUT_BLOG = join(OUT_DIR, 'blog');

// --- Config ---
const SITE_URL = 'https://aureasystems.es';
const SITE_NAME = 'Aurea Systems';
const SITE_LOGO = 'https://assets.cdn.filesafe.space/ju5vSpTX0hpH3uI8cPSE/media/69dbf5c8982fd67a359f470a.png';

// --- Markdown ---
const md = new MarkdownIt({ html: true, linkify: true, typographer: true });

// Plugin minimalista para añadir id a headings (para TOC y anchors)
md.core.ruler.push('add_heading_ids', state => {
  state.tokens.forEach((token, i) => {
    if (token.type === 'heading_open') {
      const next = state.tokens[i + 1];
      if (next && next.type === 'inline') {
        const slug = slugify(next.content, { lower: true, strict: true, locale: 'es' });
        token.attrSet('id', slug);
      }
    }
  });
});

// --- Utilidades ---
const escapeHtml = s => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const formatDateHuman = iso => {
  const d = new Date(iso);
  return d.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
};

const readingTime = text => {
  const words = text.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
};

const initials = name => name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

const avatarHtml = (author) => author.avatar && !author.avatar.includes('xxxxxx')
  ? `<img src="${escapeHtml(author.avatar)}" alt="${escapeHtml(author.name)}" />`
  : escapeHtml(initials(author.name));

const replaceAll = (str, map) =>
  Object.entries(map).reduce((acc, [k, v]) => acc.split(`{{${k}}}`).join(v ?? ''), str);

// --- Carga de datos ---
async function loadAuthors() {
  const files = (await readdir(AUTHORS_DIR)).filter(f => f.endsWith('.json'));
  const map = {};
  for (const f of files) {
    const data = JSON.parse(await readFile(join(AUTHORS_DIR, f), 'utf8'));
    map[data.id] = data;
  }
  return map;
}

async function loadPosts(authors) {
  if (!existsSync(POSTS_DIR)) return [];
  const files = (await readdir(POSTS_DIR)).filter(f => f.endsWith('.md'));
  const posts = [];
  for (const f of files) {
    const raw = await readFile(join(POSTS_DIR, f), 'utf8');
    const { data, content } = matter(raw);

    if (data.draft === true) continue;

    const slug = data.slug || slugify(basename(f, '.md').replace(/^\d{4}-\d{2}-\d{2}-/, ''), { lower: true, strict: true, locale: 'es' });
    const author = authors[data.author];
    if (!author) {
      console.warn(`⚠️  Post ${f}: autor desconocido "${data.author}". Saltado.`);
      continue;
    }

    const html = md.render(content);
    posts.push({
      slug,
      title: data.title,
      description: data.description,
      category: data.category || 'General',
      date: data.date,
      cover: data.cover,
      coverAlt: data.cover_alt || data.title,
      coverCaption: data.cover_caption || null,
      author,
      faq: data.faq || [],
      tocEnabled: data.toc !== false,
      relatedSlugs: data.related || [],
      html,
      rawContent: content,
      readingTime: readingTime(html),
    });
  }
  posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  return posts;
}

// --- Bloques HTML específicos ---
function buildToc(html) {
  const headings = [...html.matchAll(/<h2 id="([^"]+)"[^>]*>(.*?)<\/h2>/g)];
  if (headings.length < 3) return '';
  const items = headings.map(([, id, text]) =>
    `<li><a href="#${id}">${text}</a></li>`).join('\n');
  return `
    <nav class="post-toc" aria-label="Tabla de contenidos">
      <div class="post-toc__title">En este artículo</div>
      <ol>${items}</ol>
    </nav>`;
}

function buildFaq(faq) {
  if (!faq.length) return '';
  const items = faq.map(({ q, a }) => `
    <div class="post-faq__item">
      <div class="post-faq__question">${escapeHtml(q)}</div>
      <div class="post-faq__answer">${md.renderInline(a)}</div>
    </div>`).join('\n');
  return `
    <section class="post-faq">
      <h2 class="post-faq__title">Preguntas frecuentes</h2>
      ${items}
    </section>`;
}

function buildRelated(currentPost, allPosts) {
  let related;
  if (currentPost.relatedSlugs.length) {
    related = currentPost.relatedSlugs
      .map(s => allPosts.find(p => p.slug === s))
      .filter(Boolean)
      .slice(0, 3);
  } else {
    related = allPosts
      .filter(p => p.slug !== currentPost.slug && p.category === currentPost.category)
      .slice(0, 3);
    if (related.length < 3) {
      const filler = allPosts.filter(p => p.slug !== currentPost.slug && !related.includes(p));
      related = related.concat(filler).slice(0, 3);
    }
  }
  if (!related.length) return '';
  const cards = related.map(renderPostCard).join('\n');
  return `
    <section class="post-related">
      <h2 class="post-related__title">Sigue leyendo</h2>
      <div class="blog-grid">${cards}</div>
    </section>`;
}

function renderPostCard(post) {
  return `
    <a href="/blog/${post.slug}/" class="blog-card">
      <div class="blog-card__image" style="background-image: url('${escapeHtml(post.cover)}')"></div>
      <div class="blog-card__body">
        <div class="blog-card__meta">
          <span class="blog-card__category">${escapeHtml(post.category)}</span>
          <span>•</span>
          <span>${post.readingTime} min</span>
        </div>
        <h3 class="blog-card__title">${escapeHtml(post.title)}</h3>
        <p class="blog-card__excerpt">${escapeHtml(post.description)}</p>
        <div class="blog-card__author">
          <span class="blog-card__author-avatar">${avatarHtml(post.author)}</span>
          <span>${escapeHtml(post.author.name)}</span>
        </div>
      </div>
    </a>`;
}

function renderHeroCard(post) {
  return `
    <a href="/blog/${post.slug}/" class="blog-hero-card">
      <div class="blog-hero-card__image" style="background-image: url('${escapeHtml(post.cover)}')"></div>
      <div class="blog-hero-card__body">
        <div class="blog-hero-card__meta">
          <span class="blog-hero-card__category">${escapeHtml(post.category)}</span>
          <span>•</span>
          <time datetime="${post.date}">${formatDateHuman(post.date)}</time>
          <span>•</span>
          <span>${post.readingTime} min</span>
        </div>
        <h2 class="blog-hero-card__title">${escapeHtml(post.title)}</h2>
        <p class="blog-hero-card__excerpt">${escapeHtml(post.description)}</p>
        <span class="blog-hero-card__cta">Leer artículo →</span>
      </div>
    </a>`;
}

// --- Schema.org ---
function articleSchema(post, url) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    image: post.cover,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      '@type': 'Person',
      name: post.author.name,
      url: post.author.linkedin,
      sameAs: [post.author.linkedin],
      jobTitle: post.author.role,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: SITE_LOGO },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    articleSection: post.category,
    inLanguage: 'es-ES',
  };
  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE_URL + '/' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: SITE_URL + '/blog/' },
      { '@type': 'ListItem', position: 3, name: post.title, item: url },
    ],
  };
  const all = [schema, breadcrumbs];
  if (post.faq.length) {
    all.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: post.faq.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    });
  }
  return JSON.stringify(all, null, 2);
}

function blogIndexSchema(posts) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Blog de Aurea Systems',
    description: 'Estrategias y sistemas para clínicas de medicina estética.',
    url: SITE_URL + '/blog/',
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: SITE_LOGO },
    },
    blogPost: posts.slice(0, 10).map(p => ({
      '@type': 'BlogPosting',
      headline: p.title,
      url: `${SITE_URL}/blog/${p.slug}/`,
      datePublished: p.date,
      author: { '@type': 'Person', name: p.author.name },
    })),
  }, null, 2);
}

// --- SEO files ---
function buildSitemap(posts) {
  const urls = [
    { loc: SITE_URL + '/', priority: '1.0', changefreq: 'monthly' },
    { loc: SITE_URL + '/blog/', priority: '0.9', changefreq: 'weekly' },
    ...posts.map(p => ({
      loc: `${SITE_URL}/blog/${p.slug}/`,
      lastmod: p.date,
      priority: '0.8',
      changefreq: 'monthly',
    })),
  ];
  const items = urls.map(u => `  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items}
</urlset>
`;
}

function buildRobots() {
  return `User-agent: *
Allow: /

# Bloquear rutas internas
Disallow: /abm/
Disallow: /api/

# IA — permitidos explícitamente
User-agent: GPTBot
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: anthropic-ai
Allow: /
User-agent: Google-Extended
Allow: /
User-agent: PerplexityBot
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;
}

function buildLlmsTxt(posts) {
  const postLines = posts.map(p =>
    `- [${p.title}](${SITE_URL}/blog/${p.slug}/): ${p.description}`).join('\n');
  return `# Aurea Systems

> Sistemas de captación con IA para clínicas de medicina estética. Convertimos inversión publicitaria en primeras valoraciones reales mediante IA conversacional 24/7, protocolo anti no-show y creative studio.

## Producto principal
- [Patient Flow](${SITE_URL}/#sistema): el sistema completo de Aurea Systems para llenar la agenda de una clínica de medicina estética.

## Blog
${postLines}

## Contacto
- Web: ${SITE_URL}
- Email: hola@aureasystems.es
- Reservar diagnóstico: ${SITE_URL}/#reservar
`;
}

async function buildLlmsFullTxt(posts) {
  const sections = posts.map(p => `# ${p.title}

URL: ${SITE_URL}/blog/${p.slug}/
Autor: ${p.author.name} (${p.author.linkedin})
Categoría: ${p.category}
Publicado: ${p.date}

${p.rawContent.trim()}

---
`).join('\n');
  return `# Aurea Systems — Contenido completo del blog

> Versión completa de los artículos publicados, optimizada para que los LLMs puedan citarlos con precisión.

${sections}`;
}

function buildRss(posts) {
  const items = posts.slice(0, 20).map(p => `    <item>
      <title>${escapeHtml(p.title)}</title>
      <link>${SITE_URL}/blog/${p.slug}/</link>
      <guid isPermaLink="true">${SITE_URL}/blog/${p.slug}/</guid>
      <description>${escapeHtml(p.description)}</description>
      <author>${escapeHtml(p.author.email || 'hola@aureasystems.es')} (${escapeHtml(p.author.name)})</author>
      <category>${escapeHtml(p.category)}</category>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
    </item>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Blog Aurea Systems</title>
    <link>${SITE_URL}/blog/</link>
    <atom:link href="${SITE_URL}/blog/feed.xml" rel="self" type="application/rss+xml" />
    <description>Estrategias y sistemas para clínicas de medicina estética.</description>
    <language>es-ES</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`;
}

// --- Build principal ---
async function main() {
  console.log('🔨 Construyendo blog de Aurea Systems...\n');

  // Limpiar dist
  if (existsSync(OUT_DIR)) await rm(OUT_DIR, { recursive: true });
  await mkdir(OUT_BLOG, { recursive: true });

  // Cargar plantillas y partials
  const [postTpl, indexTpl, navHtml, footerHtml, blogCss] = await Promise.all([
    readFile(join(TEMPLATES_DIR, 'post.html'), 'utf8'),
    readFile(join(TEMPLATES_DIR, 'index.html'), 'utf8'),
    readFile(join(PARTIALS_DIR, 'nav.html'), 'utf8'),
    readFile(join(PARTIALS_DIR, 'footer.html'), 'utf8'),
    readFile(join(PARTIALS_DIR, 'blog.css'), 'utf8'),
  ]);

  // Cargar contenido
  const authors = await loadAuthors();
  const posts = await loadPosts(authors);
  console.log(`📰 ${posts.length} artículos encontrados.`);

  if (!posts.length) {
    console.warn('⚠️  No hay artículos. Genera al menos uno en /content/posts/');
  }

  // Copiar CSS del blog a /blog/blog.css
  await writeFile(join(OUT_BLOG, 'blog.css'), blogCss);

  // Renderizar cada post
  for (const post of posts) {
    const url = `${SITE_URL}/blog/${post.slug}/`;
    const html = replaceAll(postTpl, {
      TITLE: escapeHtml(post.title),
      DESCRIPTION: escapeHtml(post.description),
      CANONICAL_URL: url,
      COVER_IMAGE: escapeHtml(post.cover),
      COVER_ALT: escapeHtml(post.coverAlt),
      COVER_CAPTION_BLOCK: post.coverCaption
        ? `<figcaption class="post-cover__caption">${escapeHtml(post.coverCaption)}</figcaption>` : '',
      CATEGORY: escapeHtml(post.category),
      PUBLISHED_AT: post.date,
      PUBLISHED_AT_HUMAN: formatDateHuman(post.date),
      READING_TIME: post.readingTime,
      AUTHOR_NAME: escapeHtml(post.author.name),
      AUTHOR_ROLE: escapeHtml(post.author.role),
      AUTHOR_BIO: escapeHtml(post.author.bio),
      AUTHOR_LINKEDIN: escapeHtml(post.author.linkedin),
      AUTHOR_AVATAR: avatarHtml(post.author),
      AUTHOR_AVATAR_LARGE: avatarHtml(post.author),
      CONTENT: post.html,
      TOC_BLOCK: post.tocEnabled ? buildToc(post.html) : '',
      FAQ_BLOCK: buildFaq(post.faq),
      RELATED_BLOCK: buildRelated(post, posts),
      SCHEMA_JSON: articleSchema(post, url),
      NAV: navHtml,
      FOOTER: footerHtml,
    });
    const dir = join(OUT_BLOG, post.slug);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, 'index.html'), html);
    console.log(`  ✓ /blog/${post.slug}/`);
  }

  // Renderizar índice
  const heroBlock = posts.length ? renderHeroCard(posts[0]) : '';
  const gridBlock = posts.slice(1).map(renderPostCard).join('\n');
  const indexHtml = replaceAll(indexTpl, {
    HERO_POST_BLOCK: heroBlock,
    POSTS_GRID: gridBlock,
    SCHEMA_JSON: blogIndexSchema(posts),
    NAV: navHtml,
    FOOTER: footerHtml,
  });
  await writeFile(join(OUT_BLOG, 'index.html'), indexHtml);
  console.log(`  ✓ /blog/`);

  // Archivos SEO en raíz
  await writeFile(join(OUT_DIR, 'sitemap.xml'), buildSitemap(posts));
  await writeFile(join(OUT_DIR, 'robots.txt'), buildRobots());
  await writeFile(join(OUT_DIR, 'llms.txt'), buildLlmsTxt(posts));
  await writeFile(join(OUT_DIR, 'llms-full.txt'), await buildLlmsFullTxt(posts));
  await writeFile(join(OUT_BLOG, 'feed.xml'), buildRss(posts));
  console.log(`  ✓ sitemap.xml, robots.txt, llms.txt, llms-full.txt, feed.xml`);

  console.log(`\n✅ Build completo en ${OUT_DIR}`);
}

main().catch(err => { console.error(err); process.exit(1); });
