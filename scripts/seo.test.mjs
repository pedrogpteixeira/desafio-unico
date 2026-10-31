import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const finalize = resolve('scripts/finalize-seo.mjs');
const index = readFileSync('src/index.html', 'utf8');

function run({ context, url, siteUrl } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'du-seo-'));
  const output = join(root, 'dist/desafio-unico/browser');
  mkdirSync(output, { recursive: true });
  writeFileSync(join(output, 'index.html'), index);
  const env = { ...process.env };
  delete env.PUBLIC_SITE_URL; delete env.CONTEXT; delete env.URL;
  if (context !== undefined) env.CONTEXT = context;
  if (url !== undefined) env.URL = url;
  if (siteUrl !== undefined) env.PUBLIC_SITE_URL = siteUrl;
  const result = spawnSync(process.execPath, [finalize], { cwd: root, env, encoding: 'utf8' });
  const read = name => readFileSync(join(output, name), 'utf8');
  return { root, output, result, read };
}
const cleanup = f => rmSync(f.root, { recursive: true, force: true });

test('index source has auditable robots, title, description, language and viewport', () => {
  assert.match(index, /name="robots" content="index,follow"/);
  assert.match(index, /lang="pt-PT"/);
  assert.match(index, /<title>[^<]+<\/title>/);
  assert.match(index, /name="description" content="[^"]+"/);
  assert.match(index, /name="viewport"/);
});

test('local build allows indexing but does not invent canonical or sitemap', () => {
  const f = run();
  try {
    assert.equal(f.result.status, 0, f.result.stderr);
    assert.match(f.read('index.html'), /name="robots" content="index,follow"/);
    assert.match(f.read('robots.txt'), /Allow: \/\n/);
    assert.ok(!existsSync(join(f.output, 'sitemap.xml')));
    assert.doesNotMatch(f.read('index.html'), /rel="canonical"/);
    assert.match(f.read('carreiras/index.html'), /Carreiras e Candidaturas/);
  } finally { cleanup(f); }
});

test('production uses configured official HTTPS domain with two route-specific pages', () => {
  const f = run({ context: 'production', siteUrl: 'https://desafiounico.example' });
  try {
    assert.equal(f.result.status, 0, f.result.stderr);
    const home = f.read('index.html');
    const careers = f.read('carreiras/index.html');
    assert.match(home, /rel="canonical" href="https:\/\/desafiounico\.example\/"/);
    assert.match(careers, /rel="canonical" href="https:\/\/desafiounico\.example\/carreiras\/"/);
    assert.equal((home.match(/rel="canonical"/g) || []).length, 1);
    assert.match(careers, /content="Conhece a Desafio Único, descobre o nosso espírito/);
    assert.match(home, /name="robots" content="index,follow"/);
    assert.match(f.read('robots.txt'), /Sitemap: https:\/\/desafiounico\.example\/sitemap\.xml/);
    assert.match(f.read('sitemap.xml'), /<loc>https:\/\/desafiounico\.example\/carreiras\/<\/loc>/);
    const json = JSON.parse(home.match(/<script type="application\/ld\+json">(.+?)<\/script>/s)?.[1]);
    assert.equal(json['@graph'].find(n => n['@type'] === 'Organization').telephone, '+351934509190');
    assert.doesNotMatch(careers, /"JobPosting"/); // sample vacancies aren't actual advertised jobs
  } finally { cleanup(f); }
});

test('production falls back to Netlify URL instead of silently becoming noindex', () => {
  const f = run({ context: 'production', url: 'https://desafio-unico.netlify.app' });
  try {
    assert.equal(f.result.status, 0, f.result.stderr);
    assert.match(f.read('index.html'), /rel="canonical" href="https:\/\/desafio-unico\.netlify\.app\/"/);
    assert.match(f.read('index.html'), /name="robots" content="index,follow"/);
    assert.match(f.result.stderr, /PUBLIC_SITE_URL/);
  } finally { cleanup(f); }
});

test('production fails explicitly without official domain or Netlify URL', () => {
  const f = run({ context: 'production' });
  try {
    assert.notEqual(f.result.status, 0);
    assert.match(f.result.stderr, /PUBLIC_SITE_URL/);
  } finally { cleanup(f); }
});

test('deploy previews remain noindex even if an official domain is configured', () => {
  const f = run({ context: 'deploy-preview', siteUrl: 'https://desafiounico.example' });
  try {
    assert.equal(f.result.status, 0, f.result.stderr);
    assert.match(f.read('index.html'), /noindex,nofollow/);
    assert.match(f.read('carreiras/index.html'), /noindex,nofollow/);
    assert.doesNotMatch(f.read('index.html'), /rel="canonical"/);
    assert.match(f.read('robots.txt'), /Disallow: \/\n/);
    assert.ok(!existsSync(join(f.output, 'sitemap.xml')));
  } finally { cleanup(f); }
});

test('invalid domain values are rejected', () => {
  for (const siteUrl of ['http://desafiounico.example', 'https://desafiounico.example/path', 'https://desafiounico.example/?preview=1', 'ftp://desafiounico.example']) {
    const f = run({ context: 'production', siteUrl });
    try {
      assert.notEqual(f.result.status, 0, siteUrl);
      assert.match(f.result.stderr, /HTTPS/);
    } finally { cleanup(f); }
  }
});

test('source and Netlify routes remain intact', () => {
  const toml = readFileSync('netlify.toml', 'utf8');
  const app = readFileSync('src/app/app.component.ts', 'utf8');
  const routes = readFileSync('src/app/app.routes.ts', 'utf8');
  assert.match(toml, /from = "\/carreiras"\s+to = "\/carreiras\/"/);
  assert.match(toml, /publish = "dist\/desafio-unico\/browser"/);
  assert.match(app, /NavigationEnd/);
  assert.match(routes, /path: 'carreiras'/);
});


test('robots.txt is deployed as a real static asset before SPA redirects', () => {
  assert.match(readFileSync('public/robots.txt', 'utf8'), /^User-agent: \*\nAllow: \/\n$/);
  assert.match(readFileSync('public/_redirects', 'utf8'), /\/\* \/index\.html 200/);
  const html = readFileSync('src/app/app.component.html', 'utf8');
  assert.match(html, /@if \(initialRouteReady\(\)\) \{\s*<footer class="site-footer"/);
  const app = readFileSync('src/app/app.component.ts', 'utf8');
  assert.match(app, /NavigationEnd/);
  assert.match(app, /initialRouteReady\.set\(true\)/);
});
