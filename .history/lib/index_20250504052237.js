/**
 * File: lib/index.js
 * Source: Newly created to centralize exports
 * Refactorings: Extract Class, Replace Constructor with Factory Method
 * Functionality: Main entry point that exports all public modules
 */

const JisonEngine = require('./core/jison-engine');
const ParserFactory = require('./factories/parser-factory');
const LexerFactory = require('./factories/lexer-factory');
const cli = require('./cli');

// Export public API
module.exports = {
  JisonEngine,
  ParserFactory,
  LexerFactory,
  cli
};