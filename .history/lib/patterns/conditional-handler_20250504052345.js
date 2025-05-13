/**
 * File: lib/patterns/conditional-handler.js
 * Source: New pattern implementation
 * Refactorings: Decompose Conditional, Replace Conditional with Polymorphism
 * Functionality: Handles complex conditional logic
 */

// Strategy pattern for handling different grammar types
class ConditionalHandler {
    constructor() {
      this.handlers = {
        'bnf': this.handleBNF.bind(this),
        'ebnf': this.handleEBNF.bind(this),
        'lalr': this.handleLALR.bind(this),
        'lr0': this.handleLR0.bind(this),
        'lr1': this.handleLR1.bind(this),
        'slr': this.handleSLR.bind(this)
      };
    }
    
    // Replace Conditional with Polymorphism
    processGrammarByType(grammar) {
      const type = grammar.type || 'bnf';
      const handler = this.handlers[type] || this.handleDefault;
      return handler(grammar);
    }
    
    // Individual handlers for each grammar type
    handleBNF(grammar) {
      return { type: 'bnf', productions: grammar.productions || [] };
    }
    
    handleEBNF(grammar) {
      return { type: 'ebnf', productions: grammar.productions || [] };
    }
    
    handleLALR(grammar) {
      return { type: 'lalr', productions: grammar.productions || [] };
    }
    
    handleLR0(grammar) {
      return { type: 'lr0', productions: grammar.productions || [] };
    }
    
    handleLR1(grammar) {
      return { type: 'lr1', productions: grammar.productions || [] };
    }
    
    handleSLR(grammar) {
      return { type: 'slr', productions: grammar.productions || [] };
    }
    
    handleDefault(grammar) {
      return { type: 'default', productions: grammar.productions || [] };
    }
  }
  
  module.exports = ConditionalHandler;