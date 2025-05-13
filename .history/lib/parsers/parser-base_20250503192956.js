/**
 * lib/parsers/parser-base.js
 * 
 * Abstract base class for all parser types
 * 
 * Refactorings applied:
 * - Extract Class: Created abstract base class for all parser types
 * - Replace Conditional with Polymorphism: Preparation for parser type polymorphism
 */

"use strict";

const { GrammarError } = require('../util/error-handler');

/**
 * Abstract base class for all parser types
 */
class ParserBase {
    /**
     * Create a new parser
     * @param {Object} grammar - Grammar object
     * @param {Object} options - Parser options
     */
    constructor(grammar, options = {}) {
        if (this.constructor === ParserBase) {
            throw new Error("ParserBase is an abstract class and cannot be instantiated directly");
        }
        
        this.grammar = grammar;
        this.options = options;
        this.terminals = [];
        this.productions = [];
        this.symbols = [];
        this.conflicts = 0;
        this.resolutions = [];
        this.DEBUG = options.debug || false;
    }
    
    /**
     * Abstract method to build the parsing table
     */
    buildTable() {
        throw new Error("Abstract method buildTable must be implemented by subclass");
    }
    
    /**
     * Abstract method to create a parser
     */
    createParser() {
        throw new Error("Abstract method createParser must be implemented by subclass");
    }
    
    /**
     * Abstract method to generate parser module code
     * @param {Object} options - Generation options
     */
    generate(options) {
        throw new Error("Abstract method generate must be implemented by subclass");
    }
    
    /**
     * Process the grammar for parsing
     */
    processGrammar() {
        throw new Error("Abstract method processGrammar must be implemented by subclass");
    }

    /**
     * Log a trace message when in debug mode
     * @param {...*} args - Message arguments
     */
    trace(...args) {
        if (this.DEBUG) {
            console.log(...args);
        }
    }
    
    /**
     * Log a warning message
     * @param {...*} args - Message arguments
     */
    warn(...args) {
        console.warn(...args);
    }
    
    /**
     * Throw an error
     * @param {String} message - Error message
     */
    error(message) {
        throw new GrammarError(message);
    }
}

module.exports = ParserBase;