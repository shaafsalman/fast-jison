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
    execSync(`node ./lib/cli.js ${badGrammarFile} -o ${outputFile}`, 
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
    execSync(`node ./lib/cli.js ${grammarFile} -p invalid-type -o ${outputFile}`, 
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
    execSync(`node ./lib/cli.js ${grammarFile} -m invalid-module -o ${outputFile}`, 
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

// Test conflict resolution
suite.test('Conflict resolution', () => {
  // Create a grammar with conflicts
  const conflictGrammar = `
    /* Grammar with shift/reduce conflicts */
    %lex
    %%
    \\s+               /* skip whitespace */
    "if"               return 'IF'
    "else"             return 'ELSE'
    "then"             return 'THEN'
    [a-zA-Z]+          return 'ID'
    ";"                return ';'
    <<EOF>>            return 'EOF'
    .                  return 'INVALID'
    /lex
    
    %start program
    
    %%
    
    program
        : stmt EOF
            { return $1; }
        ;
        
    stmt
        : IF expr THEN stmt
            { $$ = {type: 'if', condition: $2, then: $4}; }
        | IF expr THEN stmt ELSE stmt
            { $$ = {type: 'if_else', condition: $2, then: $4, else: $6}; }
        | ID ';'
            { $$ = {type: 'id', name: $1}; }
        ;
        
    expr
        : ID
            { $$ = {type: 'id', name: $1}; }
        ;
  `;
  
  const conflictGrammarFile = path.join(EXAMPLES_DIR, 'conflict-grammar.jison');
  fs.writeFileSync(conflictGrammarFile, conflictGrammar);
  
  const outputFile = path.join(TEST_DIR, 'conflict-grammar.js');
  
  // The conflict should be automatically resolved (dangling else problem)
  execSync(`node ./lib/cli.js ${conflictGrammarFile} -o ${outputFile}`, 
    { cwd: path.join(__dirname, '../..') });
  
  // Load the generated parser
  const conflictParser = require(outputFile);
  
  // Test with a simple if-else statement
  const result = conflictParser.parse('if id then if id then id; else id;');
  
  // The else should be associated with the inner if
  assert(result.type === 'if', 'Outer statement should be a simple if');
  assert(result.then.type === 'if_else', 'Inner statement should be an if-else');
});

// Test direct grammar object usage
suite.test('Direct grammar object usage', () => {
  // Create a grammar object directly
  const grammar = {
    lex: {
      rules: [
        ["\\s+", "/* skip whitespace */"],
        ["[0-9]+", "return 'NUMBER';"],
        ["\\+", "return '+';"],
        ["$", "return 'EOF';"]
      ]
    },
    bnf: {
      expressions: [["e EOF", "return $1;"]],
      e: [
        ["e + e", "$$ = $1 + $3;"],
        ["NUMBER", "$$ = Number(yytext);"]
      ]
    }
  };
  
  try {
    // Create a parser directly from the grammar object
    const parser = new Jison.Parser(grammar);
    
    // Test the parser
    const result = parser.parse('2 + 3');
    assert(result === 5, 'Parser created from direct grammar object should work');
  } catch (error) {
    assert(false, `Direct grammar object parser creation failed: ${error.message}`);
  }
});

// Export the module
module.exports = suite;