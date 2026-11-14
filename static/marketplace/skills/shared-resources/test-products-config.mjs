// Offline test for products-config.mjs. Run: node --test test-products-config.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseProductsConfig, loadProductsConfig, ProductsConfigError } from './products-config.mjs';

const SAMPLE = `
# header comment
products:
  validate:
    description: "Validation tools"
    work_area: "Core Data Services"
    repositories:
      - validate
      - transform

  system-engineering:
    description: "System-level engineering"
    repositories:
      - ".github"
      - outlaw-tracker

  dependencies:
    description: "External dependencies"
    ignore: true
    repositories:
      - FFmpeg
      - opensearch-java

  node-products:
    ignore: true
    description: "Other nodes"
    repositories:
      - atlas
      - archive-viewer

  archived_repositories:
    description: "Archived"
    ignore: true
    repositories: []

  not-ignored:
    ignore: false
    repositories:
      - kept

forked_repositories:
  - FFmpeg
  - pds-thin-egress-app
`;

test('collects repositories of ignore: true products, lower-cased', () => {
  const { ignored } = parseProductsConfig(SAMPLE);
  assert.deepEqual([...ignored].sort((a, b) => a.localeCompare(b)), ['archive-viewer', 'atlas', 'ffmpeg', 'opensearch-java']);
});

test('does not ignore products without ignore: true', () => {
  const { ignored } = parseProductsConfig(SAMPLE);
  assert.ok(!ignored.has('validate'));
  assert.ok(!ignored.has('kept'));
});

test('maps every product repository, unquoting names', () => {
  const { mapped } = parseProductsConfig(SAMPLE);
  assert.ok(mapped.has('.github'));
  assert.ok(mapped.has('kept'));
  assert.ok(mapped.has('atlas'));
});

test('ignores the forked_repositories section and empty repository lists', () => {
  const { mapped, ignoredProducts } = parseProductsConfig(SAMPLE);
  assert.ok(!mapped.has('pds-thin-egress-app'));
  assert.deepEqual(ignoredProducts.get('archived_repositories'), []);
  assert.deepEqual(ignoredProducts.get('node-products'), ['atlas', 'archive-viewer']);
});

test('loadProductsConfig wraps response body read failures in ProductsConfigError', async () => {
  const realFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    text: async () => {
      throw new TypeError('terminated');
    },
  });
  try {
    await assert.rejects(
      loadProductsConfig('https://example.invalid/pds-products.yaml'),
      (err) => err instanceof ProductsConfigError && /terminated/.test(err.message)
    );
  } finally {
    globalThis.fetch = realFetch;
  }
});
