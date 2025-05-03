/**
 * lib/jison.js
 * 
 * Main entry point for Jison parser generator
 * 
 * Refactorings applied:
 * - Separate Domain from Presentation: Main module only exports functionality
 * - Replace Constructor with Factory Method: Using factories for creation
 */

"use strict";

/**
 * Jison - LR(0), SLR(1), LALR(1), LR(1) Parser Generator
 * 
 * By Zachary Carter <zach@carter.name>
 * MIT Licensed
 */

const Grammar = require('./core/grammar');
const ParserFactory = require('./parsers/parser-factory');
const version = require('../package.json').version;

/**
 * Main Jison namespace
 */
const Jison = {
    /**
     * Version of Jison
     */
    version,
    
    /**
     * Generate a parser from a grammar
     * @param {Object|String} grammar - Grammar specification
     * @param {Object} options - Parser options
     * @returns {Object} - Parser instance
     */
    Parser: function(grammar, options) {
        const generator = Jison.Generator(grammar, options);
        return generator.createParser();
    },
    
    /**
     * Create a parser generator
     * @param {Object|String} grammar - Grammar specification
     * @param {Object} options - Parser options
     * @returns {Object} - Parser generator instance
     */
    Generator: function(grammar, options) {
        return ParserFactory.createParser(grammar, options);
    },
    
    /**
     * Print utility for debugging
     * @param {...*} args - Messages to print
     */
    print: (typeof console !== 'undefined' && console.log) ? 
        console.log.bind(console) : 
        (typeof puts !== 'undefined') ? 
            function() { puts([].join.call(arguments, ' ')); } : 
            (typeof print !== 'undefined') ? 
                print : 
                function() {}
};

// Export the Jison namespace
module.exports = Jison;