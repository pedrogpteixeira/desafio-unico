import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Post-build SEO metadata for the two public Angular routes.
 * Netlify's built-in URL is an explicit fallback when PUBLIC_SITE_URL is absent,
 * preventing a successful production build with a hidden noindex directive.
 * Previews are always noindex; localhost is indexable for Lighthouse audits.
 * This script does not change JS/Angular or Netlify Forms.
 */
const output = join('dist', 'desafio-unico', 'browser');
const indexFile = join(output, 'index.html');
if (!existsSync(indexFile)) throw new Error('Build Angular inexistente: dist/desafio-unico/browser/index.html');

const context = (process.env.CONTEXT ?? '').trim();
const isPreview = Boolean(context && context !== 'production');
const isProduction = context === 'production';
const rawOrigin = (process.env.PUBLIC_SITE_URL || (isProduction ? process.env.URL : '') || '').trim();

function getOrigin(value) {
  if (!value) return null;
  let parsed;
  try { parsed = new URL(value); }
  catch { throw new Error('PUBLIC_SITE_URL / URL deve ser um endereço HTTPS válido.'); }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== '/') {
    throw new Error('PUBLIC_SITE_URL / URL deve ser uma origem HTTPS, sem caminho, parâmetros ou credenciais.');
  }
  return parsed.origin;
}

// Do not accidentally make a production deployment unindexable without noticing.
// NETLIFY provides URL in production; custom domains should override it explicitly.
if (isProduction && !rawOrigin) {
  throw new Error('SEO produção: define PUBLIC_SITE_URL=https://dominio-oficial.pt na Netlify (ou confirma a variável URL).');
}
const origin = isPreview ? null : getOrigin(rawOrigin);
const isIndexable = !isPreview;

const pages = [
  {
    path: '/',
    file: indexFile,
    title: 'Desafio Único | Eletricidade e Gás Natural para Casa e Empresas',
    description: 'Na Desafio Único ajudamos particulares e empresas a conhecer soluções de eletricidade e gás natural, com acompanhamento comercial próximo e esclarecimento de dúvidas.',
    ogTitle: 'Desafio Único | Energia para Casa e Empresas',
    ogDescription: 'Eletricidade e gás natural para particulares e empresas, com acompanhamento comercial da Desafio Único.',
    pageType: 'WebPage',
  },
  {
    path: '/carreiras/',
    file: join(output, 'carreiras', 'index.html'),
    title: 'Carreiras e Candidaturas | Desafio Único',
    description: 'Conhece a Desafio Único, descobre o nosso espírito de equipa e envia uma candidatura espontânea para oportunidades no setor energético.',
    ogTitle: 'Carreiras | Desafio Único',
    ogDescription: 'Conhece a nossa cultura de equipa e apresenta a tua candidatura à Desafio Único.',
    pageType: 'CollectionPage',
  },
];

function upsertMeta(html, attr, key, content) {
  const escape = v => v.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
  const tag = `<meta ${attr}="${key}" content="${escape(content)}">`;
  const pattern = new RegExp(`<meta\\s+${attr}="${key}"\\s+content="[^"]*"\\s*\\/?>(?:\\s*)`, 'i');
  return pattern.test(html) ? html.replace(pattern, `${tag}\n  `) : html.replace('</head>', `  ${tag}\n</head>`);
}

const source = readFileSync(indexFile, 'utf8');
if (!source.includes('<du-root>')) throw new Error('O index.html não contém a aplicação Angular Desafio Único.');
if (!/<meta\s+name="robots"\s+content="index,follow"/.test(source)) {
  throw new Error('HTML de origem deve ter robots=index,follow para permitir a auditoria local.');
}

for (const page of pages) {
  const url = origin ? `${origin}${page.path}` : null;
  let html = source;
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${page.title}</title>`);
  html = upsertMeta(html, 'name', 'description', page.description);
  html = upsertMeta(html, 'name', 'robots', isIndexable ? 'index,follow' : 'noindex,nofollow');
  html = upsertMeta(html, 'property', 'og:title', page.ogTitle);
  html = upsertMeta(html, 'property', 'og:description', page.ogDescription);
  if (url) {
    const structuredData = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite', '@id': `${origin}/#website`, url: `${origin}/`,
          name: 'Desafio Único', inLanguage: 'pt-PT',
        },
        {
          '@type': 'Organization', '@id': `${origin}/#organizacao`, url: `${origin}/`,
          name: 'Desafio Único', description: 'Acompanhamento comercial em soluções de eletricidade e gás natural para particulares e empresas.',
          email: 'gestao@desafiounico.pt', telephone: '+351934509190',
          address: { '@type': 'PostalAddress', streetAddress: 'Rua Bartolomeu Dias 9', postalCode: '4200-126', addressLocality: 'Porto', addressCountry: 'PT' },
        },
        {
          '@type': page.pageType, '@id': `${url}#pagina`, url,
          name: page.title, description: page.description, inLanguage: 'pt-PT',
          isPartOf: { '@id': `${origin}/#website` },
          about: { '@id': `${origin}/#organizacao` },
        },
      ],
    };
    const jsonLd = JSON.stringify(structuredData).replaceAll('<', '\\u003c');
    html = html.replace('</head>', `  <link rel="canonical" href="${url}">\n  <meta property="og:url" content="${url}">\n  <meta name="seo:site-origin" content="${origin}">\n  <script type="application/ld+json">${jsonLd}</script>\n</head>`);
  }
  mkdirSync(join(output, 'carreiras'), { recursive: true });
  writeFileSync(page.file, html);
}

const robotsFile = join(output, 'robots.txt');
const sitemapFile = join(output, 'sitemap.xml');
if (!isIndexable) {
  writeFileSync(robotsFile, 'User-agent: *\nDisallow: /\n');
  rmSync(sitemapFile, { force: true });
  console.log('SEO: deploy de pré-visualização, indexação bloqueada.');
} else if (origin) {
  writeFileSync(robotsFile, `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
  writeFileSync(sitemapFile, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(p => `  <url><loc>${origin}${p.path}</loc></url>`).join('\n')}\n</urlset>\n`);
  console.log(`SEO: produção indexável com canonical e sitemap: ${origin}`);
  if (!process.env.PUBLIC_SITE_URL) console.warn('SEO: a usar URL fornecido pela Netlify. Define PUBLIC_SITE_URL se o domínio oficial for diferente.');
} else {
  // Local static build: no fake origin/canonical, but Lighthouse stays indexable.
  writeFileSync(robotsFile, 'User-agent: *\nAllow: /\n');
  rmSync(sitemapFile, { force: true });
  console.log('SEO: build local indexável; configura PUBLIC_SITE_URL para canonical e sitemap de produção.');
}
