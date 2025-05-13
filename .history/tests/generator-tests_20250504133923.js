/**
 * Tests for different generator types
 */

const { TestSuite, assert } = require('./test-utils');
const Jison = require('../../lib/index');

const suite = new TestSuite('Generator tests');

// Test generator creation for different types
suite.test('Generator creation', () => {
  const grammar = {
    bnf: {
      test: ["test1", "test2"]
    }
  };
  
  const generatorTypes = ['lr0', 'slr', 'lalr', 'lr', 'll'];
  
  generatorTypes.forEach(type => {
    const options = { type };
    const generator = Jison.Generator(grammar, options);
    assert(generator, `${type} generator should be created`);
    assert(generator.type === type || 
          (type === 'lalr' && generator.type === 'LALR(1)') ||
          (type === 'lr' && generator.type === 'Canonical LR(1)') ||
          (type === 'lr0' && generator.type === 'LR(0)') ||
          (type === 'slr' && generator.type === 'SLR(1)') ||
          (type === 'll' && generator.type === 'LL(1)'),
      `Generator type should match requested type (${type}, got ${generator.type})`);
  });
});

// Test generator with more complex grammar
suite.test('Complex generator creation', () => {
  const grammar = {
    lex: {
      rules: [
        ["\\s+", "/* skip whitespace */"],
        ["[0-9]+", "return 'NUMBER';"],
        ["\\+", "return '+';"],
        ["-", "return '-';"],
        ["\\*", "return '*';"],
        ["\\/", "return '/';"],
        ["\\(", "return '(';"],
        ["\\)", "return ')';"],
        ["$", "return 'EOF';"]
      ]
    },
    operators: [
      ["left", "+", "-"],
      ["left", "*", "/"],
      ["left", "UMINUS"]
    ],
    bnf: {
      expressions: [["e EOF", "return $1;"]],
      e: [
        ["e + e", "$$ = $1 + $3;"],
        ["e - e", "$$ = $1 - $3;"],
        ["e * e", "$$ = $1 * $3;"],
        ["e / e", "$$ = $1 / $3;"],
        ["- e %prec UMINUS", "$$ = -$2;"],
        ["( e )", "$$ = $2;"],
        ["NUMBER", "$$ = Number(yytext);"]
      ]
    }
  };
  
  // Test each generator type with the complex grammar
  const generatorTypes = ['lr0', 'slr', 'lalr', 'lr'];
  
  generatorTypes.forEach(type => {
    const options = { type };
    const generator = Jison.Generator(grammar, options);
    assert(generator, `Complex ${type} generator should be created`);
    
    // Ensure the generator has the correct structure
    assert(generator.productions, 'Generator should have productions');
    assert(generator.symbols, 'Generator should have symbols');
    assert(generator.terminals, 'Generator should have terminals');
    assert(typeof generator.createParser === 'function', 'Generator should have createParser method');
  });
});

// Test generator functionality
suite.test('Generator functionality', () => {
  const grammar = {
    bnf: {
      expressions: [["e EOF", "return $1;"]],
      e: [
        ["e + e", "$$ = $1 + $3;"],
        ["e - e", "$$ = $1 - $3;"],
        ["NUMBER", "$$ = Number(yytext);"]
      ]
    }
  };
  
  const generator = Jison.Generator(grammar);
  assert(generator, 'Generator should be created');
  
  // Test createParser method
  const parser = generator.createParser();
  assert(parser, 'Generator should create a parser');
  assert(typeof parser.parse === 'function', 'Created parser should have a parse method');
});

// Export the module
module.exports = suite;