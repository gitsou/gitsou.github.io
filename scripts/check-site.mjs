import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const failures = [];

function fail(message) {
  failures.push(message);
}

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = resolve(directory, entry.name);

    if (entry.isDirectory()) {
      return entry.name.startsWith('.') ? [] : walk(entryPath);
    }

    return entry.isFile() ? [entryPath] : [];
  });
}

function isExternalUrl(url) {
  return /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(url);
}

const allFiles = walk(root);
const htmlFiles = allFiles.filter((file) => file.endsWith('.html'));

for (const htmlFile of htmlFiles) {
  const html = readFileSync(htmlFile, 'utf8');
  const attributePattern = /\b(?:href|src)="([^"]+)"/g;

  for (const match of html.matchAll(attributePattern)) {
    const url = match[1];

    if (isExternalUrl(url)) {
      continue;
    }

    const localPath = url.split(/[?#]/, 1)[0];

    if (!localPath) {
      continue;
    }

    const target = resolve(htmlFile, '..', localPath);

    if (!existsSync(target)) {
      fail(`${relative(root, htmlFile)} references missing ${url}`);
    }
  }
}

for (const scriptFile of allFiles.filter((file) => file.endsWith('.js'))) {
  const result = spawnSync(process.execPath, ['--check', scriptFile], { encoding: 'utf8' });

  if (result.status !== 0) {
    fail(`JavaScript syntax error in ${relative(root, scriptFile)}: ${result.stderr.trim()}`);
  }
}

const sitemapPath = resolve(root, 'sitemap.xml');
const sitemap = readFileSync(sitemapPath, 'utf8');
const urlBlocks = [...sitemap.matchAll(/<url>\s*<loc>([^<]+)<\/loc>\s*<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>[\s\S]*?<\/url>/g)];
const openingUrlTags = (sitemap.match(/<url>/g) ?? []).length;
const closingUrlTags = (sitemap.match(/<\/url>/g) ?? []).length;

if (!sitemap.startsWith('<?xml version="1.0" encoding="UTF-8"?>') || !sitemap.includes('<urlset ') || !sitemap.trim().endsWith('</urlset>')) {
  fail('sitemap.xml is not a complete XML sitemap document');
}

if (urlBlocks.length === 0) {
  fail('sitemap.xml contains no URL entries');
}

if (openingUrlTags !== closingUrlTags || urlBlocks.length !== openingUrlTags) {
  fail('sitemap.xml contains a malformed URL entry');
}

const sitemapUrls = urlBlocks.map((match) => match[1]);

if (new Set(sitemapUrls).size !== sitemapUrls.length) {
  fail('sitemap.xml contains duplicate URLs');
}

if (sitemapUrls.includes('https://gitsou.github.io/index.html')) {
  fail('sitemap.xml includes non-canonical index.html');
}

for (const url of sitemapUrls) {
  if (!url.startsWith('https://gitsou.github.io/')) {
    fail(`sitemap.xml contains a non-site URL: ${url}`);
    continue;
  }

  const sitePath = url.slice('https://gitsou.github.io/'.length) || 'index.html';

  if (!existsSync(resolve(root, sitePath))) {
    fail(`sitemap.xml references missing ${sitePath}`);
  }
}

if (failures.length > 0) {
  console.error(failures.map((message) => `- ${message}`).join('\n'));
  process.exit(1);
}

console.log(`Site checks passed: ${htmlFiles.length} HTML files, ${sitemapUrls.length} sitemap URLs.`);
