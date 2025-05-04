/**
 * Tests for different module types
 */

const { TestSuite, assert } = require('./test-utils');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TEST_DIR = path.join(__dirname, '../test-output');
const EXAMPLES_DIR = path.join(__dirname, '../test-grammars');

const suite = new TestSuite('Module type tests');

// Test module type options
suite.test('Module type options', () => {
  const grammarFile = path.join(EXAMPLES_DIR, 'calculator.jison');
  
  const moduleTypes = ['commonjs', 'amd', 'js'];
  
  moduleTypes.forEach(moduleType => {
    const outputFile = path.join(TEST_DIR, `calculator-${moduleType}.js`);
    
    // Use the CLI to compile the grammar with specific module type
    execSync(`node ../lib/cli.js ${grammarFile} -m ${moduleType} -o ${outputFile}`, 
      { cwd: path.join(__dirname, '../..') });
    
    // Check that the output file exists
    assert(fs.existsSync(outputFile), `Output file should exist for module type: ${moduleType}`);
    
    // Check module type in the output file content
    const content = fs.readFileSync(outputFile, 'utf8');
    
    if (moduleType === 'amd') {
      assert(content.includes('define('), 'AMD module should include define()');
    } else if (moduleType === 'commonjs') {
      assert(content.includes('exports.parser'), 'CommonJS module should include exports.parser');
    } else if (moduleType === 'js') {
      assert(!content.includes('define(') && !content.includes('exports.parser'),
        'JS module should not include AMD or CommonJS exports');
    }
  });
});

// Very simple sanity check: TEST_DIR should be a non-empty string
suite.test('TEST_DIR is non-empty string', () => {
  assert(typeof TEST_DIR === 'string' && TEST_DIR.length > 0, 'TEST_DIR should be a non-empty string');
});

// Very simple sanity check: EXAMPLES_DIR is non-empty string
suite.test('EXAMPLES_DIR is non-empty string', () => {
  assert(typeof EXAMPLES_DIR === 'string' && EXAMPLES_DIR.length > 0, 'EXAMPLES_DIR should be a non-empty string');
});

// Confirm that fs.existsSync returns a boolean
suite.test('fs.existsSync returns boolean', () => {
  const result = fs.existsSync(TEST_DIR);
  assert(typeof result === 'boolean', 'fs.existsSync should return a boolean');
});

module.exports = suite;
