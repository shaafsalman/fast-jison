/**
 * Tests for different module types
 */

const { TestSuite, assert } = require('./test-utils');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const runTests = require('../run-tests');
const ROOT_DIR = runTests.ROOT_DIR || path.resolve(__dirname, '../');
const LIB_DIR = runTests.LIB_DIR || path.join(ROOT_DIR, 'lib');
const CLI_PATH = runTests.CLI_PATH || path.join(LIB_DIR, 'cli.js');
const TEST_DIR = runTests.TEST_DIR || path.join(ROOT_DIR, 'test-output');
const EXAMPLES_DIR = runTests.EXAMPLES_DIR || path.join(ROOT_DIR, 'test-grammars');

// Create directories if they don't exist
[TEST_DIR, EXAMPLES_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const suite = new TestSuite('Module type tests');

// Test module type options
suite.test('Module type options', () => {
  const grammarFile = path.join(EXAMPLES_DIR, 'calculator.jison');
  
  const moduleTypes = ['commonjs', 'amd', 'js'];
  
  moduleTypes.forEach(moduleType => {
    const outputFile = path.join(TEST_DIR, `calculator-${moduleType}.js`);
    
    // Use the CLI to compile the grammar with specific module type
    execSync(`node ${CLI_PATH} ${grammarFile} -m ${moduleType} -o ${outputFile}`, 
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

// Test CommonJS module usage
suite.test('CommonJS module usage', () => {
  const grammarFile = path.join(EXAMPLES_DIR, 'calculator.jison');
  const outputFile = path.join(TEST_DIR, 'calculator-commonjs.js');
  
  // Compile grammar with CommonJS module type
  execSync(`node ${CLI_PATH} ${grammarFile} -m commonjs -o ${outputFile}`, 
    { cwd: path.join(__dirname, '../..') });
  
  // Load the parser and test it
  const parser = require(outputFile);
  assert(parser.parser, 'CommonJS module should expose parser property');
  assert(parser.Parser, 'CommonJS module should expose Parser constructor');
  assert(typeof parser.parse === 'function', 'CommonJS module should expose parse function');
  
  // Test actual parsing
  const result = parser.parse('2 + 3');
  assert(result === 5, 'CommonJS parser should correctly evaluate 2 + 3');
});

// Test JS module format
suite.test('JS module format', () => {
  const grammarFile = path.join(EXAMPLES_DIR, 'calculator.jison');
  const outputFile = path.join(TEST_DIR, 'calculator-js.js');
  
  // Compile grammar with JS module type
  execSync(`node ${CLI_PATH} ${grammarFile} -m js -o ${outputFile}`, 
    { cwd: path.join(__dirname, '../..') });
  
  // Check generated file structure
  const content = fs.readFileSync(outputFile, 'utf8');
  
  // JS module should define a global variable with the parser
  assert(content.includes('var calculator ='), 'JS module should define a global variable');
  assert(content.includes('function Parser()'), 'JS module should define Parser constructor');
});

// Export the module
module.exports = suite;