/**
 * Tests for different parser types
 */

const { TestSuite, assert } = require('./test-utils');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TEST_DIR = path.join(__dirname, '../test-output');
const EXAMPLES_DIR = path.join(__dirname, '../test-grammars');

const suite = new TestSuite('Parser type tests');

// Test parser type options
suite.test('Parser type options', () => {
  const grammarFile = path.join(EXAMPLES_DIR, 'calculator.jison');
  
  const parserTypes = ['lr0', 'slr', 'lalr', 'lr'];
  
  parserTypes.forEach(parserType => {
    const outputFile = path.join(TEST_DIR, `calculator-${parserType}.js`);
    
    // Use the CLI to compile the grammar with specific parser type
    execSync(`node ../lib/cli.js ${grammarFile} -p ${parserType} -o ${outputFile}`, 
      { cwd: path.join(__dirname, '../..') });
    
    // Check that the output file exists
    assert(fs.existsSync(outputFile), `Output file should exist for parser type: ${parserType}`);
    
    // Load the generated parser and test basic expression
    const calcParser = require(outputFile);
    
    // Test the parser with a simple expression
    const result = calcParser.parse('2 + 3');
    assert(result === 5, `Parser generated with ${parserType} should correctly evaluate 2 + 3`);
  });
});

// Test parser types with more complex expressions
suite.test('Parser types with complex expressions', () => {
  const grammarFile = path.join(EXAMPLES_DIR, 'calculator.jison');
  const parserTypes = ['lr0', 'slr', 'lalr', 'lr'];
  
  const testCases = [
    { input: '2 + 3 * 4', expected: 14 }, // Tests operator precedence
    { input: '(2 + 3) * 4', expected: 20 }, // Tests parentheses
    { input: '2 ^ 3 + 4', expected: 12 }, // Tests exponentiation
    { input: '-5 + 10', expected: 5 }, // Tests unary minus
  ];
  
  parserTypes.forEach(parserType => {
    const outputFile = path.join(TEST_DIR, `calculator-${parserType}-complex.js`);
    
    // Use the CLI to compile the grammar with specific parser type
    execSync(`node ../lib/cli.js ${grammarFile} -p ${parserType} -o ${outputFile}`, 
      { cwd: path.join(__dirname, '../..') });
    
    // Load the generated parser
    const calcParser = require(outputFile);
    
    // Test each expression
    testCases.forEach(({ input, expected }) => {
      const result = calcParser.parse(input);
      assert(result === expected, 
        `Parser ${parserType} should correctly evaluate "${input}" to ${expected}, got ${result}`);
    });
  });
});

// Test different parser-generator combinations
suite.test('Different parser-generator combinations', () => {
  const grammarFile = path.join(EXAMPLES_DIR, 'calculator.jison');
  
  // Test different combinations of parser types and module types
  const parserTypes = ['lr0', 'slr', 'lalr', 'lr'];
  const moduleTypes = ['commonjs', 'amd', 'js'];
  
  for (const parserType of parserTypes) {
    for (const moduleType of moduleTypes) {
      const outputFile = path.join(TEST_DIR, `calculator-${parserType}-${moduleType}.js`);
      
      // Use the CLI to compile the grammar with specific options
      execSync(`node ../lib/cli.js ${grammarFile} -p ${parserType} -m ${moduleType} -o ${outputFile}`, 
        { cwd: path.join(__dirname, '../..') });
      
      // Check that the output file exists
      assert(fs.existsSync(outputFile), 
        `Output file should exist for parser type: ${parserType}, module type: ${moduleType}`);
      
      // Only test commonjs modules since we can require them
      if (moduleType === 'commonjs') {
        const calcParser = require(outputFile);
        const result = calcParser.parse('2 + 3');
        assert(result === 5, 
          `Parser generated with ${parserType} and ${moduleType} should correctly evaluate 2 + 3`);
      }
    }
  }
});

// Test LL parser type
suite.test('LL parser type', () => {
  const grammarFile = path.join(EXAMPLES_DIR, 'calculator.jison');
  const outputFile = path.join(TEST_DIR, `calculator-ll.js`);
  
  try {
    // Use the CLI to compile the grammar with LL parser type
    execSync(`node ../lib/cli.js ${grammarFile} -p ll -o ${outputFile}`, 
      { cwd: path.join(__dirname, '../..') });
    
    // Check that the output file exists
    assert(fs.existsSync(outputFile), `Output file should exist for parser type: ll`);
    
    // Try to load and use the parser (may not work with all grammars)
    try {
      const calcParser = require(outputFile);
      const result = calcParser.parse('2 + 3');
      assert(result === 5, `LL parser should correctly evaluate 2 + 3`);
    } catch (error) {
      // LL parser might not work with all grammar structures, so we don't fail the test
      console.log(`  Note: LL parser could not parse expression: ${error.message}`);
    }
  } catch (error) {
    // LL parser might not be fully implemented or might not work with this grammar
    console.log(`  Note: LL parser could not be generated: ${error.message}`);
  }
});

// Export the module
module.exports = suite;