/**
 * Integration tests for Jison
 */

const { TestSuite, assert } = require('./test-utils');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TEST_DIR = path.join(__dirname, '../test-output');
const EXAMPLES_DIR = path.join(__dirname, '../test-grammars');

const suite = new TestSuite('Integration tests');

// Test lexical grammar support
suite.test('Lexical grammar support', () => {
  const grammarFile = path.join(EXAMPLES_DIR, 'calc-grammar.jison');
  const lexerFile = path.join(EXAMPLES_DIR, 'calc-lexer.jisonlex');
  const outputFile = path.join(TEST_DIR, 'calc-with-lexer.js');
  
  // Compile with separate lexer file
  execSync(`node ./lib/cli.js ${grammarFile} ${lexerFile} -o ${outputFile}`, 
    { cwd: path.join(__dirname, '../..') });
  
  // Check that the output file exists
  assert(fs.existsSync(outputFile), 'Output file should exist');
  
  // Load the generated parser
  const calcParser = require(outputFile);
  
  // Test the parser
  const testCases = [
    { input: '2 + 3', expected: 5 },
    { input: '2 * 3', expected: 6 },
    { input: '2 + 3 * 4', expected: 14 }, // Tests precedence
    { input: '(2 + 3) * 4', expected: 20 },
  ];
  
  testCases.forEach(({ input, expected }) => {
    const result = calcParser.parse(input);
    assert(result === expected, 
      `Parsing "${input}" should return ${expected}, got ${result}`);
  });
});

// Test JSON input format
suite.test('JSON input format', () => {
  const jsonGrammarFile = path.join(EXAMPLES_DIR, 'calculator.json');
  const outputFile = path.join(TEST_DIR, 'calculator-json.js');
  
  // Compile with JSON input format
  execSync(`node ./lib/cli.js ${jsonGrammarFile} -j -o ${outputFile}`, 
    { cwd: path.join(__dirname, '../..') });
  
  // Check that the output file exists
  assert(fs.existsSync(outputFile), 'Output file should exist');
  
  // Load the generated parser
  const calcParser = require(outputFile);
  
  // Test the parser
  const testCases = [
    { input: '2 + 3', expected: 5 },
    { input: '2 * 3', expected: 6 },
    { input: '2 ^ 3', expected: 8 },
  ];
  
  testCases.forEach(({ input, expected }) => {
    const result = calcParser.parse(input);
    assert(result === expected, 
      `Parsing "${input}" should return ${expected}, got ${result}`);
  });
});

// Test debug mode
suite.test('Debug mode', () => {
  const grammarFile = path.join(EXAMPLES_DIR, 'calculator.jison');
  const outputFile = path.join(TEST_DIR, 'calculator-debug.js');
  
  // Compile with debug mode enabled
  execSync(`node ./lib/cli.js ${grammarFile} -t -o ${outputFile}`, 
    { cwd: path.join(__dirname, '../..') });
  
  // Check that the output file exists
  assert(fs.existsSync(outputFile), 'Output file should exist');
  
  // Check if debug info is included in the output
  const content = fs.readFileSync(outputFile, 'utf8');
  assert(content.includes('debug: true'), 'Debug mode should be enabled in the output');
  
  // Load the generated parser
  const calcParser = require(outputFile);
  
  // Test the parser still works in debug mode
  const result = calcParser.parse('2 + 3');
  assert(result === 5, 'Parser in debug mode should correctly evaluate 2 + 3');
});

// Test module name option
suite.test('Module name option', () => {
  const grammarFile = path.join(EXAMPLES_DIR, 'calculator.jison');
  const outputFile = path.join(TEST_DIR, 'calculator-custom-name.js');
  
  // Compile with custom module name
  execSync(`node ./lib/cli.js ${grammarFile} --moduleName customCalculator -o ${outputFile}`, 
    { cwd: path.join(__dirname, '../..') });
  
  // Check that the output file exists
  assert(fs.existsSync(outputFile), 'Output file should exist');
  
  // Check if custom module name is used in the output
  const content = fs.readFileSync(outputFile, 'utf8');
  assert(content.includes('var customCalculator ='), 
    'Custom module name should be used in the output');
  
  // Load the generated parser and test it
  const calcParser = require(outputFile);
  const result = calcParser.parse('2 + 3');
  assert(result === 5, 'Parser with custom module name should correctly evaluate 2 + 3');
});

// Test input from stdin and output to stdout
suite.test('Stdin input and stdout output', () => {
  const tempInputFile = path.join(TEST_DIR, 'temp-grammar.jison');
  
  // Create a simple grammar
  const simpleGrammar = `
    %lex
    %%
    \\s+          /* skip whitespace */
    [0-9]+        return 'NUMBER'
    "+"           return '+'
    <<EOF>>       return 'EOF'
    /lex
    
    %%
    
    expressions
        : e EOF
            { return $1; }
        ;
    
    e
        : e '+' NUMBER
            { $$ = $1 + Number($3); }
        | NUMBER
            { $$ = Number($1); }
        ;
  `;
  
  fs.writeFileSync(tempInputFile, simpleGrammar);
  
  // Test piping input to the CLI
  const result = execSync(`cat ${tempInputFile} | node ./lib/cli.js`, 
    { cwd: path.join(__dirname, '../..') }).toString();
  
  // Check that output contains a parser
  assert(result.includes('function Parser()'), 'Output should contain a parser');
  assert(result.includes('parse:'), 'Output should contain parse function');
});

// Test end-to-end workflow with stdin test cases
suite.test('End-to-end workflow with test cases', () => {
  const calculatorFile = path.join(TEST_DIR, 'calculator.js');
  
  // Create a test input file
  const testInputFile = path.join(TEST_DIR, 'calc-test-input.txt');
  const testInput = '2 + 3 * 4';
  fs.writeFileSync(testInputFile, testInput);
  
  // Run the parser with the test input
  const result = execSync(`node ${calculatorFile} ${testInputFile}`).toString().trim();
  
  // Check the output
  assert(result === '14', 'Parser should correctly evaluate the test input');
});

// Export the module
module.exports = suite;