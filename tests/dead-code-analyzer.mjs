/**
 * Dead Code Analyzer
 *
 * Identifies unused functions, variables, imports, and CSS classes.
 * Helps clean up technical debt and reduce bundle size.
 *
 * Usage:
 *   node tests/dead-code-analyzer.mjs
 *   node tests/dead-code-analyzer.mjs --verbose
 *   node tests/dead-code-analyzer.mjs --type functions
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

class DeadCodeAnalyzer {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.type = options.type || 'all';
    this.results = {
      deadFunctions: [],
      unusedImports: [],
      unusedVariables: [],
      unusedCssClasses: [],
      deadExports: [],
      total: 0,
    };
  }

  log(message, level = 'info') {
    if (!this.verbose && level === 'debug') return;
    const timestamp = new Date().toISOString();
    const prefix = {
      error: '✗ ERROR  ',
      warning: '⚠ WARN   ',
      pass: '✓ PASS   ',
      debug: '• DEBUG  ',
      info: 'ℹ INFO   ',
    }[level] || 'ℹ INFO   ';
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  getFiles(dir, ext = '.js') {
    const files = [];
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue;
        if (entry.name === 'node_modules' || entry.name === '.git') continue;

        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          files.push(...this.getFiles(fullPath, ext));
        } else if (entry.name.endsWith(ext) || entry.name.endsWith('.mjs')) {
          files.push(fullPath);
        }
      }
    } catch (e) {
      // Directory not accessible
    }
    return files;
  }

  parseJavaScript(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return {
        path: filePath,
        content,
        functions: this.extractFunctionNames(content),
        imports: this.extractImports(content),
        exports: this.extractExports(content),
        usages: this.extractUsages(content),
      };
    } catch (e) {
      return null;
    }
  }

  extractFunctionNames(content) {
    const patterns = [
      /function\s+(\w+)\s*\(/g,
      /const\s+(\w+)\s*=\s*(?:async\s*)?\(/g,
      /const\s+(\w+)\s*=\s*(?:async\s*)?\w+\s*=>/g,
    ];

    const functions = [];
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        functions.push(match[1]);
      }
    }
    return [...new Set(functions)];
  }

  extractImports(content) {
    const imports = [];
    const pattern = /import\s+(?:{|(\w+))\s*(?:{([^}]+)})?\s*from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      if (match[1]) {
        imports.push({ name: match[1], source: match[3] });
      }
      if (match[2]) {
        match[2].split(',').forEach((name) => {
          imports.push({ name: name.trim(), source: match[3] });
        });
      }
    }
    return imports;
  }

  extractExports(content) {
    const exports = [];
    const patterns = [
      /export\s+(?:default\s+)?(?:function|class|const)\s+(\w+)/g,
      /export\s+{\s*([^}]+)\s*}/g,
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (match[1].includes(',')) {
          match[1].split(',').forEach((name) => {
            exports.push(name.trim());
          });
        } else {
          exports.push(match[1]);
        }
      }
    }
    return [...new Set(exports)];
  }

  extractUsages(content) {
    const usages = new Set();
    const pattern = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      usages.add(match[1]);
    }
    return usages;
  }

  analyzeFunctions() {
    this.log('Analyzing functions...', 'debug');
    console.log('\n=== Dead Functions ===');

    const jsFiles = this.getFiles(rootDir, '.js');
    const allFunctions = new Map();
    const allUsages = new Set();

    for (const file of jsFiles) {
      const parsed = this.parseJavaScript(file);
      if (!parsed) continue;

      for (const func of parsed.functions) {
        if (!allFunctions.has(func)) {
          allFunctions.set(func, []);
        }
        allFunctions.get(func).push(file);
      }

      for (const usage of parsed.usages) {
        allUsages.add(usage);
      }
    }

    const internalFunctions = ['log', 'initialize', 'process', 'run', 'main'];
    for (const [func, files] of allFunctions.entries()) {
      if (!allUsages.has(func) && !internalFunctions.includes(func)) {
        this.results.deadFunctions.push({ name: func, files });
        this.log(`Unused function: ${func} (in ${files[0]})`, 'warning');
      }
    }
  }

  analyzeImports() {
    this.log('Analyzing imports...', 'debug');
    console.log('\n=== Unused Imports ===');

    const jsFiles = this.getFiles(rootDir, '.js');
    const allContent = jsFiles.map((f) => fs.readFileSync(f, 'utf-8')).join('\n');

    for (const file of jsFiles) {
      const parsed = this.parseJavaScript(file);
      if (!parsed) continue;

      for (const imp of parsed.imports) {
        const usage = new RegExp(`\\b${imp.name}\\b`).exec(
          parsed.content.replace(/import[^;]+;?/g, '')
        );
        if (!usage && !allContent.includes(imp.name)) {
          this.results.unusedImports.push({ name: imp.name, source: imp.source, file });
          this.log(`Unused import: ${imp.name} from '${imp.source}'`, 'warning');
        }
      }
    }
  }

  analyzeCss() {
    this.log('Analyzing CSS...', 'debug');
    console.log('\n=== Unused CSS Classes ===');

    const cssFiles = this.getFiles(rootDir, '.css');
    const jsFiles = this.getFiles(rootDir, '.js');
    const htmlFiles = this.getFiles(rootDir, '.html');

    const allContent = [
      ...jsFiles.map((f) => fs.readFileSync(f, 'utf-8')),
      ...htmlFiles.map((f) => fs.readFileSync(f, 'utf-8')),
    ].join('\n');

    for (const cssFile of cssFiles) {
      const cssContent = fs.readFileSync(cssFile, 'utf-8');
      const classPattern = /\.([a-zA-Z_-][a-zA-Z0-9_-]*)\s*{/g;

      let match;
      while ((match = classPattern.exec(cssContent)) !== null) {
        const className = match[1];
        if (!allContent.includes(className)) {
          this.results.unusedCssClasses.push({ className, file: cssFile });
          this.log(`Unused CSS class: .${className}`, 'warning');
        }
      }
    }
  }

  analyzeExports() {
    this.log('Analyzing exports...', 'debug');
    console.log('\n=== Unused Exports ===');

    const jsFiles = this.getFiles(rootDir, '.js');
    const allContent = jsFiles.map((f) => fs.readFileSync(f, 'utf-8')).join('\n');

    for (const file of jsFiles) {
      const parsed = this.parseJavaScript(file);
      if (!parsed) continue;

      const fileContent = fs.readFileSync(file, 'utf-8');
      const otherContent = allContent.replace(fileContent, '');

      for (const exp of parsed.exports) {
        if (!otherContent.includes(exp) && exp !== 'default') {
          this.results.deadExports.push({ name: exp, file });
          this.log(`Potentially unused export: ${exp}`, 'warning');
        }
      }
    }
  }

  printResults() {
    console.log('\n' + '='.repeat(70));
    console.log('DEAD CODE ANALYSIS RESULTS');
    console.log('='.repeat(70));

    const totalIssues =
      this.results.deadFunctions.length +
      this.results.unusedImports.length +
      this.results.unusedCssClasses.length +
      this.results.deadExports.length;

    console.log(`Total Issues Found: ${totalIssues}`);
    console.log(`Dead Functions: ${this.results.deadFunctions.length}`);
    console.log(`Unused Imports: ${this.results.unusedImports.length}`);
    console.log(`Unused CSS Classes: ${this.results.unusedCssClasses.length}`);
    console.log(`Dead Exports: ${this.results.deadExports.length}`);
    console.log('='.repeat(70));

    if (totalIssues === 0) {
      console.log('\n✓ No dead code detected!');
    } else {
      console.log('\nRecommended Actions:');
      console.log('1. Review each issue carefully before removal');
      console.log('2. Verify no external code depends on these exports');
      console.log('3. Remove in small batches and test thoroughly');
      console.log('4. Check git history to understand removal context');
    }

    console.log('\n' + '='.repeat(70));
  }

  async run() {
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║  Dead Code Analyzer - Code Quality Audit                       ║');
    console.log('║  Phase 3: Code Quality & Testing                              ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');

    if (this.type === 'all' || this.type === 'functions') {
      this.analyzeFunctions();
    }

    if (this.type === 'all' || this.type === 'imports') {
      this.analyzeImports();
    }

    if (this.type === 'all' || this.type === 'css') {
      this.analyzeCss();
    }

    if (this.type === 'all' || this.type === 'exports') {
      this.analyzeExports();
    }

    this.printResults();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  verbose: args.includes('--verbose'),
  type: args.includes('--type') ? args[args.indexOf('--type') + 1] : 'all',
};

const analyzer = new DeadCodeAnalyzer(options);
await analyzer.run();
