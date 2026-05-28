// Test argument parsing
const args = ['nasa-pds', 'output.json', '--format', 'json', '--include-snippets'];

const parseArgs = (args) => {
  const parsed = { positional: [], flags: {} };
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const flag = args[i].slice(2);
      if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        parsed.flags[flag] = args[i + 1];
        i++;
      } else {
        parsed.flags[flag] = true;
      }
    } else {
      parsed.positional.push(args[i]);
    }
  }
  return parsed;
};

const { positional, flags } = parseArgs(args);
console.log('Positional:', positional);
console.log('Flags:', flags);

const organization = positional[0];
const format = (flags.format || 'csv').toLowerCase();
const defaultExt = format === 'json' ? '.json' : '.csv';
const outputFile = positional[1] || `sonarcloud-security-issues-${Date.now()}${defaultExt}`;
const includeSnippets = format === 'json' && flags['include-snippets'] && !flags['no-snippets'];
const includeRules = format === 'json' && flags['include-rules'];

console.log('\nParsed values:');
console.log('Organization:', organization);
console.log('Format:', format);
console.log('Output file:', outputFile);
console.log('Include snippets:', includeSnippets);
console.log('Include rules:', includeRules);
