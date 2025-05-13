/**
 * Tests for parser functionality
 */

const { TestSuite, assert } = require('./test-utils');
const Jison = require('../lib/index');
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
// Validate paths
console.log('Path validation:'); // Debug log
console.log('ROOT_DIR:', ROOT_DIR);
console.log('LIB_DIR:', LIB_DIR);
console.log('CLI_PATH:', CLI_PATH);
console.log('TEST_DIR:', TEST_DIR);
console.log('EXAMPLES_DIR:', EXAMPLES_DIR);

// Verify all paths exist
[ROOT_DIR, LIB_DIR, CLI_PATH, TEST_DIR, EXAMPLES_DIR].forEach(dir => {
  if (!dir || typeof dir !== 'string') {
    throw new Error(`Invalid path: ${dir}`);
  }
});

const suite = new TestSuite('Parser tests');

// Test compilation of calculator grammar
suite.test('Calculator grammar compilation', () => {
  try {
    const grammarFile = path.join(EXAMPLES_DIR, 'calculator.jison');
    const outputFile = path.join(TEST_DIR, 'calculator.js');
    
    console.log('Grammar file:', grammarFile); // Debug log
    console.log('Output file:', outputFile); // Debug log
    
    if (!fs.existsSync(grammarFile)) {
      throw new Error(`Grammar file not found at ${grammarFile}`);
    }

    // Use the CLI to compile the grammar
    execSync(`node ${CLI_PATH} ${grammarFile} -o ${outputFile}`, { 
      cwd: ROOT_DIR,
      stdio: 'inherit'
    });
    
    if (!fs.existsSync(outputFile)) {
      throw new Error(`Output file not created at ${outputFile}`);
    }
    
    const calculatorParser = require(outputFile);
    assert(calculatorParser, 'Calculator parser should be loaded');
    assert(typeof calculatorParser.parse === 'function', 'Calculator parser should have a parse method');
  } catch (error) {
    console.error('Compilation failed:', error);
    throw error;
  }
});
// Test calculator parser functionality
suite.test('Calculator parser functionality', () => {
  const calculatorParser = require(path.join(TEST_DIR, 'calculator.js'));
  
  const testCases = [
    { input: '2 + 3', expected: 5 },
    { input: '2 - 3', expected: -1 },
    { input: '2 * 3', expected: 6 },
    { input: '6 / 3', expected: 2 },
    { input: '2 ^ 3', expected: 8 },
    { input: '2!', expected: 2 },
    { input: '3!', expected: 6 },
    { input: '-5', expected: -5 },
    { input: '(2 + 3) * 4', expected: 20 },
    { input: 'PI', expected: Math.PI },
    { input: 'E', expected: Math.E },
    { input: '2 + 3 * 4', expected: 14 }, // Tests precedence
    { input: '2 * 3 + 4', expected: 10 }, // Tests precedence
  ];
  
  testCases.forEach(({ input, expected }) => {
    const result = calculatorParser.parse(input);
    assert(Math.abs(result - expected) < 0.00001, 
      `Parsing "${input}" should return ${expected}, got ${result}`);
  });
});

// Test JSON grammar compilation
suite.test('JSON grammar compilation', () => {
  const grammarFile = path.join(EXAMPLES_DIR, 'json.jison');
  const outputFile = path.join(TEST_DIR, 'json.js');
  
  // Use the CLI to compile the grammar
  execSync(`node ${CLI_PATH} ${grammarFile} -o ${outputFile}`, { cwd: path.join(__dirname, '../..') });
  
  // Check that the output file exists
  assert(fs.existsSync(outputFile), 'Output file should exist');
  
  // Load the generated parser
  const jsonParser = require(outputFile);
  assert(jsonParser, 'JSON parser should be loaded');
  assert(typeof jsonParser.parse === 'function', 'JSON parser should have a parse method');
});

// Test JSON parser functionality
suite.test('JSON parser functionality', () => {
  const jsonParser = require(path.join(TEST_DIR, 'json.js'));
  
  const testCases = [
    { input: '{}', expected: {} },
    { input: '[]', expected: [] },
    { input: '123', expected: 123 },
    { input: '"test"', expected: 'test' },
    { input: 'true', expected: true },
    { input: 'false', expected: false },
    { input: 'null', expected: null },
    { input: '{"a": 1, "b": "text", "c": true, "d": null, "e": [1, 2], "f": {"nested": "object"}}', 
      expected: {a: 1, b: 'text', c: true, d: null, e: [1, 2], f: {nested: 'object'}} },
    { input: '[1, "text", true, null, {}, []]', 
      expected: [1, 'text', true, null, {}, []] },
  ];
  
  testCases.forEach(({ input, expected }) => {
    const result = jsonParser.parse(input);
    assert.deepStrictEqual(result, expected, 
      `Parsing "${input}" should return correct result`);
  });
});

// Export the module
module.exports = suite;