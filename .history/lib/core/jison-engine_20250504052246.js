/**
 * File: lib/core/jison-engine.js
 * Source: Refactored from original lib/jison.js
 * Refactorings: Extract Class, Replace Constructor with Factory Method, 
 *               Move Method, Extract Method
 * Functionality: Core engine for parsing and code generation
 */

const Parser = require('./parser');
const { createTypeHelper } = require('../util/typal');

class JisonEngine {
  constructor(grammar, options = {}) {
    this.grammar = grammar;
    this.options = options;
    this.parser = null;
  }

  // Extract Method: Generate parser using grammar
  generate() {
    if (!this.parser) {
      this.parser = new Parser(this.grammar, this.options);
    }
    return this.parser.generate();
  }

  // Extract Method: Parse input using generated parser
  parse(input) {
    if (!this.parser) {
      this.generate();
    }
    return this.parser.parse(input);
  }

  // Replace Temp with Query: Get parser configuration
  getParserConfig() {
    return this.parser ? this.parser.getConfig() : null;
  }
}

module.exports = JisonEngine;