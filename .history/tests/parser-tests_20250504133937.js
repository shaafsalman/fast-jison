/**
 * Tests for parser functionality
 */

const { TestSuite, assert } = require('./test-utils');
const Jison = require('../../lib/index');
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
  execSync(`node ./lib/cli.js ${grammarFile} -o ${outputFile}`, { cwd: path.join(__dirname, '../..') });
  
  // Check that the output file exists
  assert(fs.existsSync(outputFile), 'Output file should exist');
  
  // Try to load the generated parser
  const calculatorParser = require(outputFile);
  assert(calculatorParser, 'Calculator parser should be loaded');
  assert(typeof calculatorParser.parse === 'function', 'Calculator parser should have a parse method');
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
  execSync(`node ./lib/cli.js ${grammarFile} -o ${outputFile}`, { cwd: path.join(__dirname, '../..') });
  
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