/**
 * DocFind Hugo Module - Test Runner
 * 
 * Runs automated tests for the Hugo module to ensure:
 * - Hugo builds without errors
 * - search.json output is valid JSON with expected structure
 * - HTML output contains required DocFind elements
 * - WASM/JS files exist after build script runs
 * 
 * Usage:
 *   npm test              # Run all tests
 *   npm test -- --only build   # Run only build tests
 *   npm test -- --only json    # Run only JSON tests
 *   npm test -- --only html    # Run only HTML tests
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const EXAMPLE_SITE_DIR = path.join(ROOT_DIR, 'exampleSite');
const PUBLIC_DIR = path.join(EXAMPLE_SITE_DIR, 'public');

// Colors for output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m'
};

function log(msg, color = 'reset') {
    console.log(`${colors[color]}${msg}${colors.reset}`);
}

function pass(testName) {
    log(`  ✓ ${testName}`, 'green');
    return true;
}

function fail(testName, reason) {
    log(`  ✗ ${testName}`, 'red');
    log(`    → ${reason}`, 'yellow');
    return false;
}

// ============================================
// TEST: Hugo Build
// ============================================
function testHugoBuild() {
    log('\n📦 Testing Hugo Build...', 'cyan');

    try {
        // Clean previous build
        if (fs.existsSync(PUBLIC_DIR)) {
            fs.rmSync(PUBLIC_DIR, { recursive: true, force: true });
        }

        // Run Hugo build
        execSync('hugo --minify', {
            cwd: EXAMPLE_SITE_DIR,
            stdio: 'pipe'
        });

        if (!fs.existsSync(PUBLIC_DIR)) {
            return fail('Hugo build', 'public/ directory not created');
        }

        return pass('Hugo build completes without errors');
    } catch (error) {
        return fail('Hugo build', error.message);
    }
}

// ============================================
// TEST: search.json Output
// ============================================
function testSearchJsonOutput() {
    log('\n📄 Testing search.json Output...', 'cyan');

    const searchJsonPath = path.join(PUBLIC_DIR, 'search.json');
    let results = [];

    // Test: File exists
    if (!fs.existsSync(searchJsonPath)) {
        return [fail('search.json exists', 'File not found. Run Hugo build first.')];
    }
    results.push(pass('search.json exists'));

    // Test: Valid JSON
    let data;
    try {
        const content = fs.readFileSync(searchJsonPath, 'utf-8');
        data = JSON.parse(content);
        results.push(pass('search.json is valid JSON'));
    } catch (error) {
        results.push(fail('search.json is valid JSON', error.message));
        return results;
    }

    // Test: Is array
    if (!Array.isArray(data)) {
        results.push(fail('search.json is array', `Got ${typeof data}`));
        return results;
    }
    results.push(pass('search.json is array'));

    // Test: Has entries
    if (data.length === 0) {
        results.push(fail('search.json has entries', 'Array is empty'));
        return results;
    }
    results.push(pass(`search.json has ${data.length} entries`));

    // Test: Entry structure
    const requiredFields = ['title', 'href', 'body'];
    const firstEntry = data[0];
    const missingFields = requiredFields.filter(f => !(f in firstEntry));

    if (missingFields.length > 0) {
        results.push(fail('Entry has required fields', `Missing: ${missingFields.join(', ')}`));
    } else {
        results.push(pass('Entries have required fields (title, href, body)'));
    }

    // Test: href is relative URL
    if (firstEntry.href && firstEntry.href.startsWith('/')) {
        results.push(pass('href values are relative URLs'));
    } else {
        results.push(fail('href is relative URL', `Got: ${firstEntry.href}`));
    }

    // Test: Deep Linking (Section-Level Indexing)
    // At least some entries should have '#' in href
    const hasDeepLinks = data.some(entry => entry.href.includes('#'));
    if (hasDeepLinks) {
        results.push(pass('Deep linking detected (href contains #)'));
    } else {
        results.push(fail('Deep linking', 'No entries with anchors (#) found. Section splitting might be failing.'));
    }

    // Test: Section Titles
    // At least some entries should have ' > ' in title
    const hasSectionTitles = data.some(entry => entry.title.includes(' > ') || entry.title.includes('\u003e'));
    if (hasSectionTitles) {
        results.push(pass('Section titles detected (Title > Section)'));
    } else {
        results.push(fail('Section titles', 'No entries with " > " separators found.'));
    }

    // Test: Content Hygiene (No HTML leakage)
    const hasHtmlLeak = data.some(entry => entry.body.includes('id="') || entry.body.includes('<h2'));
    if (!hasHtmlLeak) {
        results.push(pass('Content is clean (No HTML attribute leakage)'));
    } else {
        results.push(fail('Content hygiene', 'Found raw HTML (id="..." or tags) in body content.'));
    }


    return results;
}

// ============================================
// TEST: HTML Output (Partials Rendered)
// ============================================
function testHtmlOutput() {
    log('\n🌐 Testing HTML Output...', 'cyan');

    const indexPath = path.join(PUBLIC_DIR, 'index.html');
    let results = [];

    if (!fs.existsSync(indexPath)) {
        return [fail('index.html exists', 'File not found. Run Hugo build first.')];
    }
    results.push(pass('index.html exists'));

    const html = fs.readFileSync(indexPath, 'utf-8');

    // Test: DocFind CSS is included
    if (html.includes('.docfind-container')) {
        results.push(pass('DocFind CSS styles present'));
    } else {
        results.push(fail('DocFind CSS present', 'Missing .docfind-container styles'));
    }

    // Test: Inline search input (Hugo may minify and remove quotes)
    if (html.includes('id="docfind-input"') || html.includes('id=docfind-input')) {
        results.push(pass('Inline search input present'));
    } else {
        results.push(fail('Inline search input', 'Missing #docfind-input'));
    }

    // Test: Expandable widget (Hugo may minify and remove quotes)
    if (html.includes('id="docfind-expandable"') || html.includes('id=docfind-expandable')) {
        results.push(pass('Expandable widget present'));
    } else {
        results.push(fail('Expandable widget', 'Missing #docfind-expandable'));
    }

    // Test: Scripts included (Hugo may escape slashes in JS)
    if (html.includes('docfind/docfind.js') || html.includes('docfind\\/docfind.js')) {
        results.push(pass('DocFind script import present'));
    } else {
        results.push(fail('DocFind script import', 'Missing docfind.js import'));
    }

    // Test: WASM import
    if (html.includes('docfind_bg.wasm')) {
        results.push(pass('WASM import present'));
    } else {
        results.push(fail('WASM import', 'Missing docfind_bg.wasm reference'));
    }

    // Test: Accessibility - aria-labels
    const ariaLabels = (html.match(/aria-label=/g) || []).length;
    if (ariaLabels >= 2) {
        results.push(pass(`Accessibility: ${ariaLabels} aria-label attributes found`));
    } else {
        results.push(fail('Accessibility', `Only ${ariaLabels} aria-labels found (expected ≥2)`));
    }

    return results;
}

// ============================================
// TEST: Static Assets (WASM/JS exist)
// ============================================
function testStaticAssets() {
    log('\n📁 Testing Static Assets...', 'cyan');

    const staticDocfind = path.join(EXAMPLE_SITE_DIR, 'static', 'docfind');
    let results = [];

    if (!fs.existsSync(staticDocfind)) {
        results.push(fail('static/docfind/ exists', 'Directory not found. Run build script first.'));
        return results;
    }
    results.push(pass('static/docfind/ directory exists'));

    // Test: JS file exists
    const jsPath = path.join(staticDocfind, 'docfind.js');
    if (fs.existsSync(jsPath)) {
        results.push(pass('docfind.js exists'));
    } else {
        results.push(fail('docfind.js exists', 'File not found'));
    }

    // Test: WASM file exists
    const wasmPath = path.join(staticDocfind, 'docfind_bg.wasm');
    if (fs.existsSync(wasmPath)) {
        const stats = fs.statSync(wasmPath);
        results.push(pass(`docfind_bg.wasm exists (${(stats.size / 1024).toFixed(1)} KB)`));
    } else {
        results.push(fail('docfind_bg.wasm exists', 'File not found'));
    }

    return results;
}

// ============================================
// Main Test Runner
// ============================================
function main() {
    const args = process.argv.slice(2);
    const onlyFilter = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;

    log('╔═══════════════════════════════════════╗', 'cyan');
    log('║   DocFind Hugo Module - Test Suite    ║', 'cyan');
    log('╚═══════════════════════════════════════╝', 'cyan');

    let allResults = [];

    // Build test (always run first unless filtering)
    if (!onlyFilter || onlyFilter === 'build') {
        allResults.push(testHugoBuild());
    }

    // JSON tests
    if (!onlyFilter || onlyFilter === 'json') {
        allResults.push(...testSearchJsonOutput());
    }

    // HTML tests
    if (!onlyFilter || onlyFilter === 'html') {
        allResults.push(...testHtmlOutput());
    }

    // Asset tests
    if (!onlyFilter || onlyFilter === 'assets') {
        allResults.push(...testStaticAssets());
    }

    // Summary
    const passed = allResults.filter(r => r === true).length;
    const failed = allResults.filter(r => r === false).length;

    log('\n═══════════════════════════════════════', 'cyan');
    if (failed === 0) {
        log(`\n✓ All ${passed} tests passed!`, 'green');
        process.exit(0);
    } else {
        log(`\n✗ ${failed} of ${passed + failed} tests failed`, 'red');
        process.exit(1);
    }
}

main();
