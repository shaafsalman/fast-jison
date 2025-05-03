/**
 * lib/parsers/parser-factory.js
 * 
 * Factory for creating parser instances
 * 
 * Refactorings applied:
 * - Replace Constructor with Factory Method: Created factory for parser generation
 * - Replace Conditional with Polymorphism: Used dynamic class selection
 */

"use strict";

const Grammar = require('../core/grammar');

/**
 * Factory for creating parser generators
 */
class ParserFactory {
    /**
     * Get the available parser types
     * @returns {Object} - Map of parser type names to classes
     */
    static get parserTypes() {
        return {
            'lr0': require('./lr0'),
            'slr': require('./slr'),
            'lalr': require('./lalr'),
            'lr': require('./lr1'),
            'll': require('./ll1')
        };
    }
    
    /**
     * Create a parser generator for the given grammar and options
     * @param {Object|Grammar} grammar - Grammar object or specification
     * @param {Object} options - Parser options
     * @returns {Object} - Parser generator instance
     */
    static createParser(grammar, options = {}) {
        // Convert to Grammar object if it isn't already
        const grammarObj = grammar instanceof Grammar ? grammar : new Grammar(grammar);
        
        // Determine parser type from options
        const type = options.type || 'lalr';
        
        // Get the parser class
        const ParserClass = this.getParserClass(type);
        
        // Create and return the parser
        return new ParserClass(grammarObj, options);
    }
    
    /**
     * Get the parser class for the given type
     * @param {String} type - Parser type
     * @returns {Function} - Parser class constructor
     * @throws {Error} - If parser type is not supported
     */
    static getParserClass(type) {
        const ParserClass = this.parserTypes[type];
        
        if (!ParserClass) {
            throw new Error(`Unsupported parser type: ${type}`);
        }
        
        return ParserClass;
    }
}

module.exports = ParserFactory;