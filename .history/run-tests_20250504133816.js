/**
 * Main test runner for Jison refactored codebase
 * 
 * Run with: node run-tests.js
 */

const fs = require('fs');
const path = require('path');

// Create test directories
const TEST_DIR = path.join(__dirname, 'test-output');
const EXAMPLES_DIR = path.join(__dirname, 'test-grammars');

if (!fs.existsSync(TEST_DIR)) {
  fs.mkdirSync(TEST_DIR, { recursive: true });
}
if (!fs.existsSync(EXAMPLES_DIR)) {
  fs.mkdirSync(EXAMPLES_DIR, { recursive: true });
}

// Create sample grammars for testing
require('./tests/create-grammars');

// Load and run all tests
const testSuites = [
  './tests/basic-tests.js',
  './tests/generator-tests.js',
  './tests/parser-tests.js',
  './tests/module-type-tests.js',
  './tests/parser-type-tests.js',
  './tests/error-tests.js',
  './tests/integration-tests.js',
];

console.log('Running Jison tests...\n');
let totalTests = 0;
let totalPassed = 0;
let totalFailed = 0;

testSuites.forEach(suitePath => {
  try {
    const suite = require(suitePath);
    console.log(`\nRunning test suite: ${path.basename(suitePath)}`);
    
    const results = suite.runTests();
    totalTests += results.total;
    totalPassed += results.passed;
    totalFailed += results.failed;
    
    console.log(`Suite results: ${results.passed}/${results.total} tests passed\n`);
  } catch (error) {
    console.error(`Error running test suite ${suitePath}:`, error);
    totalFailed++;
  }
});

console.log('==============================================');
console.log(`Final results: ${totalPassed}/${totalTests} tests passed`);
console.log('==============================================');

if (totalFailed > 0) {
  console.log(`Failed tests: ${totalFailed}`);
  process.exit(1);
} else {
  console.log('All tests passed successfully!');
}