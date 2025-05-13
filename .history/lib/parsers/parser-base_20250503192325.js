// lib/parsers/parser-base.js
// Refactored from jison.js
// Refactorings applied:
// - Extract Class: Created an abstract base class for all parser types
// - Replace Conditional with Polymorphism: Preparing for parser type polymorphism

"use strict";

/**
 * Abstract base class for all parser types
 */
class ParserBase {
    /**
     * Create a new parser instance
     * @param {Object} grammar - Grammar object
     * @param {Object} options - Parser options
     */
    constructor(grammar, options) {
        if (this.constructor === ParserBase) {
            throw new Error("ParserBase is an abstract class and cannot be instantiated directly");
        }
        
        this.grammar = grammar;
        this.options = options || {};
        this.terminals = [];
        this.productions = [];
        this.symbols = [];
        this.conflicts = 0;
        this.hasErrorRecovery = false;
    }
    
    /**
     * Abstract method to build the parsing table
     * Must be implemented by subclasses
     */
    buildTable() {
        throw new Error("Abstract method buildTable called");
    }
    
    /**
     * Abstract method to create a parser
     * Must be implemented by subclasses
     */
    createParser() {
        throw new Error("Abstract method createParser called");
    }
    
    /**
     * Abstract method to generate a parser module
     * Must be implemented by subclasses
     */
    generate(options) {
        throw new Error("Abstract method generate called");
    }

    /**
     * Print a warning message
     * @param {String} message - Warning message
     */
    warn(...args) {
        console.warn(...args);
    }
    
    /**
     * Print a trace message when in debug mode
     * @param {String} message - Trace message
     */
    trace(...args) {
        if (this.options.debug) {
            console.log(...args);
        }
    }
    
    /**
     * Throw an error
     * @param {String} message - Error message
     */
    error(message) {
        throw new Error(message);
    }
}

module.exports = ParserBase;