/**
 * Basic tests for Jison
 * Tests module loading and basic functionality
 */

const { TestSuite, assert } = require('./test-utils');
const Jison = require('../lib/index');

const suite = new TestSuite('Basic tests');

// Test basic module loading
suite.test('Module loading', () => {
  assert(Jison, 'Jison module should be loaded');
  assert(Jison.Parser, 'Jison Parser should be available');
  assert(Jison.Generator, 'Jison Generator should be available');
  assert(typeof Jison.version === 'string', 'Jison version should be a string');
});

// Test simple parser creation
suite.test('Simple parser creation', () => {
  const grammar = {
    bnf: {
      expressions: [["e EOF", "return $1"]],
      e: [["e + e", "$$ = $1 + $3"],
          ["e - e", "$$ = $1 - $3"],
          ["NUMBER", "$$ = Number(yytext)"]]
    }
  };
  
  const parser = new Jison.Parser(grammar);
  assert(parser, 'Parser should be created');
  assert(typeof parser.parse === 'function', 'Parser should have a parse method');
});

// Export the module
module.exports = suite;