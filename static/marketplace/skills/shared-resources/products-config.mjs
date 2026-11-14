/**
 * PDS products config loader
 *
 * Reads NASA-PDS/.github conf/pds-products.yaml and reports which repositories
 * belong to a product flagged `ignore: true` (forks, other nodes' tools, ops noise).
 * Security exporters use it to leave those repositories out of triage.
 *
 * The parser handles only the layout of pds-products.yaml (products at 2-space indent,
 * keys at 4, list items at 6) so the skills need no YAML dependency.
 */

export const PRODUCTS_CONFIG_URL =
  'https://raw.githubusercontent.com/NASA-PDS/.github/main/conf/pds-products.yaml';

export class ProductsConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ProductsConfigError';
  }
}

const unquote = (value) => value.trim().replace(/^(["'])(.*)\1$/, '$2');

/**
 * @param {string} yamlText contents of pds-products.yaml
 * @returns {{ ignored: Set<string>, mapped: Set<string>, ignoredProducts: Map<string, string[]> }}
 *   Lower-cased repository names. `mapped` holds every repo listed in any product.
 */
export function parseProductsConfig(yamlText) {
  const ignored = new Set();
  const mapped = new Set();
  const ignoredProducts = new Map();

  let inProducts = false;
  let product = null;
  let productIgnored = false;
  let productRepos = [];
  let inRepos = false;

  const closeProduct = () => {
    if (product === null) return;
    for (const repo of productRepos) {
      mapped.add(repo);
      if (productIgnored) ignored.add(repo);
    }
    if (productIgnored) ignoredProducts.set(product, productRepos);
    product = null;
    productIgnored = false;
    productRepos = [];
    inRepos = false;
  };

  for (const line of yamlText.split('\n')) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) continue;

    if (/^\S/.test(line)) {
      closeProduct();
      inProducts = /^products:\s*$/.test(line);
      continue;
    }
    if (!inProducts) continue;

    const productMatch = line.match(/^ {2}([\w.-]+):\s*$/);
    if (productMatch) {
      closeProduct();
      product = productMatch[1];
      continue;
    }
    if (product === null) continue;

    if (/^ {4}ignore:\s*true\s*$/.test(line)) {
      productIgnored = true;
    } else if (/^ {4}repositories:\s*$/.test(line)) {
      inRepos = true;
    } else if (/^ {4}\S/.test(line)) {
      inRepos = false;
    } else if (inRepos) {
      const item = line.match(/^ {6}-\s+(.+?)\s*$/);
      if (item) productRepos.push(unquote(item[1]).toLowerCase());
    }
  }
  closeProduct();

  return { ignored, mapped, ignoredProducts };
}

/**
 * Fetches and parses the canonical config from NASA-PDS/.github.
 * Throws ProductsConfigError when the file cannot be fetched or yields no ignored
 * repositories (which means the file layout changed, not that nothing is ignored).
 */
export async function loadProductsConfig(url = PRODUCTS_CONFIG_URL) {
  let response;
  try {
    response = await fetch(url);
  } catch (err) {
    throw new ProductsConfigError(`Cannot fetch ${url}: ${err.message}`);
  }
  if (!response.ok) {
    throw new ProductsConfigError(`Cannot fetch ${url}: HTTP ${response.status}`);
  }

  let configText;
  try {
    configText = await response.text();
  } catch (err) {
    throw new ProductsConfigError(`Cannot fetch ${url}: ${err.message}`);
  }
  const config = parseProductsConfig(configText);
  if (config.ignored.size === 0) {
    throw new ProductsConfigError(
      `${url} lists no repositories under an "ignore: true" product; the file layout may have changed`
    );
  }
  return config;
}
