/**
 * File: lib/patterns/method-object.js
 * Source: New pattern implementation
 * Refactorings: Replace Method with Method Object, Extract Class
 * Functionality: Converts complex methods into objects
 */

// Replace Method with Method Object: Base class for method objects
class MethodObject {
    constructor(context) {
      this.context = context;
      this.result = null;
    }
    
    // Template Method pattern
    execute() {
      this.beforeExecute();
      this.doExecute();
      this.afterExecute();
      return this.result;
    }
    
    beforeExecute() {
      // Hook for subclasses
    }
    
    doExecute() {
      throw new Error('Subclasses must implement doExecute');
    }
    
    afterExecute() {
      // Hook for subclasses
    }
  }
  
  // Factory for creating method objects
  function createMethodObject(type, context) {
    // Simple registry of method object types
    const types = {
      parser: ParserMethodObject,
      lexer: LexerMethodObject,
      // Add more as needed
    };
    
    const MethodObjectClass = types[type] || MethodObject;
    return new MethodObjectClass(context);
  }
  
  // Example concrete method object
  class ParserMethodObject extends MethodObject {
    doExecute() {
      // Implementation specific to parsing
      this.result = `Parsed: ${this.context}`;
    }
  }
  
  class LexerMethodObject extends MethodObject {
    doExecute() {
      // Implementation specific to lexing
      this.result = `Lexed: ${this.context}`;
    }
  }
  
  module.exports = {
    MethodObject,
    createMethodObject
  };