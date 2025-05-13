/**
 * File: lib/factories/parser-factory.js
 * Source: New factory implementation
 * Refactorings: Replace Constructor with Factory Method, Factory Pattern
 * Functionality: Creates parser instances based on grammar type
 */

const Parser = require('../core/parser');

// Factory for creating parsers
class ParserFactory {
  // Factory Method
  static createParser(grammar, options = {}) {
    const type = grammar.type || 'default';
    
    // Could be extended with more specific parser types
    switch (type) {
      case 'bnf':
        return new BNFParser(grammar, options);
      case 'lalr':
        return new LALRParser(grammar, options);
      default:
        return new Parser(grammar, options);
    }
  }
}

// Specialized parser implementations using inheritance
class BNFParser extends Parser {
  constructor(grammar, options) {
    super(grammar, options);
    this.parserType = 'bnf';
  }
  
  // Override methods as needed
}

class LALRParser extends Parser {
  constructor(grammar, options) {
    super(grammar, options);
    this.parserType = 'lalr';
  }
  
  // Override methods as needed
}

module.exports = ParserFactory;