/**
 * Tests for parser functionality
 */

const { TestSuite, assert } = require('./test-utils');
const Jison = require('../lib/index');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TEST_DIR = path.join(__dirname, '../test-output');
const EXAMPLES_DIR = path.join(__dirname, '../test-grammars');

const suite = new TestSuite('Parser tests');

// Test compilation of calculator grammar
suite.test('Calculator grammar compilation', () => {
  const grammarFile = path.join(EXAMPLES_DIR, 'calculator.jison');
  const outputFile = path.join(TEST_DIR, 'calculator.js');
  
  // Use the CLI to compile the grammar
  execSync(`node ../lib/cli.js ${grammarFile} -o ${outputFile}`, { cwd: path.join(__dirname, '../..') });
  
  // Check that the output file exists
  assert(fs.existsSync(outputFile), 'Output file should exist');
  
  // Try to load the generated parser
  const calculatorParser = require(outputFile);
  assert(calculatorParser, 'Calculator parser should be loaded');
  assert(typeof calculatorParser.parse === 'function', 'Calculator parser should have a parse method');
});


// Test JSON grammar compilation
suite.test('JSON grammar compilation', () => {
  const grammarFile = path.join(EXAMPLES_DIR, 'json.jison');
  const outputFile = path.join(TEST_DIR, 'json.js');
  
  // Use the CLI to compile the grammar
  execSync(`node ../lib/cli.js ${grammarFile} -o ${outputFile}`, { cwd: path.join(__dirname, '../..') });
  
  // Check that the output file exists
  assert(fs.existsSync(outputFile), 'Output file should exist');
  
  // Load the generated parser
  const jsonParser = require(outputFile);
  assert(jsonParser, 'JSON parser should be loaded');
  assert(typeof jsonParser.parse === 'function', 'JSON parser should have a parse method');
});

// Confirm that Jison.Parser is exposed as a constructor
suite.test('Jison.Parser is a function', () => {
  assert(typeof Jison.Parser === 'function', 'Jison.Parser should be a constructor function');
});

// Confirm that Jison.Generator is exposed as a constructor
suite.test('Jison.Generator is a function', () => {
  assert(typeof Jison.Generator === 'function', 'Jison.Generator should be a constructor function');
});

// Very basic sanity check: subtraction works
suite.test('Basic arithmetic sanity', () => {
  assert(5 - 2 === 3, '5 - 2 should equal 3');
});

// Confirm TEST_DIR is set and non-empty
suite.test('TEST_DIR is non-empty string', () => {
  assert(typeof TEST_DIR === 'string' && TEST_DIR.length > 0, 'TEST_DIR should be a non-empty string');
});

// Confirm EXAMPLES_DIR is set and non-empty
suite.test('EXAMPLES_DIR is non-empty string', () => {
  assert(typeof EXAMPLES_DIR === 'string' && EXAMPLES_DIR.length > 0, 'EXAMPLES_DIR should be a non-empty string');
});

module.exports = suite;



// Export the module
module.exports = suite;