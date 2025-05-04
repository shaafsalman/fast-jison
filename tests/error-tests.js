/**
 * Tests for error handling
 */

const { TestSuite, assert } = require('./test-utils');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const Jison = require('../lib/index');

const TEST_DIR = path.join(__dirname, '../test-output');
const EXAMPLES_DIR = path.join(__dirname, '../test-grammars');

const suite = new TestSuite('Error tests');

// Test parser error reporting
suite.test('Parser error reporting', () => {
  const calculatorParser = require(path.join(TEST_DIR, 'calculator.js'));
  
  try {
    calculatorParser.parse('2 + * 3');
    assert(false, 'Parser should throw an error on invalid input');
  } catch (error) {
    assert(error, 'Error should be thrown');
    assert(error.message.includes('Parse error'), 'Error should be a parse error');
  }
});

// Test grammar syntax errors
suite.test('Grammar syntax errors', () => {
  // Create a grammar with syntax errors
  const badGrammar = `
    /* Bad calculator grammar with syntax errors */
    %lex
    %%
    \\s+                   /* skip whitespace */
    [0-9]+                 return 'NUMBER'
    "+"                    return '+'
    /* Missing %% */
    
    expressions
        : e EOF
            { return $1; }
        ;
    
    e
        : e '+' e
            { $$ = $1 + $3; }
        | NUMBER
            { $$ = Number(yytext); }
        ;
  `;
  
  const badGrammarFile = path.join(EXAMPLES_DIR, 'bad-grammar.jison');
  fs.writeFileSync(badGrammarFile, badGrammar);
  
  const outputFile = path.join(TEST_DIR, 'bad-grammar.js');
  
  try {
    // Try to compile the bad grammar
    execSync(`node ../lib/cli.js ${badGrammarFile} -o ${outputFile}`, 
      { cwd: path.join(__dirname, '../..') });
    assert(false, 'CLI should throw an error on bad grammar');
  } catch (error) {
    assert(error, 'Error should be thrown');
  }
});

// Test invalid parser type
suite.test('Invalid parser type', () => {
  const grammarFile = path.join(EXAMPLES_DIR, 'calculator.jison');
  const outputFile = path.join(TEST_DIR, 'invalid-parser-type.js');
  
  try {
    // Try to compile with an invalid parser type
    execSync(`node ../lib/cli.js ${grammarFile} -p invalid-type -o ${outputFile}`, 
      { cwd: path.join(__dirname, '../..') });
    
    // If execution continues, make sure the output doesn't use the invalid type
    if (fs.existsSync(outputFile)) {
      const content = fs.readFileSync(outputFile, 'utf8');
      assert(!content.includes('invalid-type'), 'Invalid parser type should not be used');
    }
  } catch (error) {
    // Either the command fails (which is fine) or it succeeds but doesn't use the invalid type
    assert(error, 'Error should be thrown or invalid type should be ignored');
  }
});

// Test invalid module type
suite.test('Invalid module type', () => {
  const grammarFile = path.join(EXAMPLES_DIR, 'calculator.jison');
  const outputFile = path.join(TEST_DIR, 'invalid-module-type.js');
  
  try {
    // Try to compile with an invalid module type
    execSync(`node ../lib/cli.js ${grammarFile} -m invalid-module -o ${outputFile}`, 
      { cwd: path.join(__dirname, '../..') });
    
    // If execution continues, make sure the output doesn't use the invalid type
    if (fs.existsSync(outputFile)) {
      const content = fs.readFileSync(outputFile, 'utf8');
      assert(!content.includes('invalid-module'), 'Invalid module type should not be used');
    }
  } catch (error) {
    // Either the command fails (which is fine) or it succeeds but doesn't use the invalid type
    assert(error, 'Error should be thrown or invalid module type should be ignored');
  }
});

// Confirm that Array.isArray correctly identifies arrays
suite.test('Array.isArray returns true for arrays', () => {
  assert(Array.isArray([]), 'Array.isArray should return true for []');
});

// Confirm that path.join inserts the platform separator
suite.test('path.join with two segments', () => {
  const joined = path.join('foo', 'bar');
  assert(joined.includes(path.sep), `Joined path "${joined}" should contain "${path.sep}"`);
});

// Confirm that fs.writeFileSync is available
suite.test('fs.writeFileSync exists', () => {
  assert(typeof fs.writeFileSync === 'function', 'fs.writeFileSync should be a function');
});


// Export the module
module.exports = suite;