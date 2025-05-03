/**
 * lib/cli/grammar-processor.js
 * 
 * Processes grammar files and generates parsers
 * 
 * Refactorings applied:
 * - Extract Class: Created GrammarProcessor for grammar handling
 * - Replace Constructor with Factory Method: Using factory pattern
 */

"use strict";

const Grammar = require('../core/grammar');
const ParserFactory = require('../parsers/parser-factory');
const { buildSettings } = require('./options');

/**
 * Processes grammar files and generates parsers
 */
class GrammarProcessor {
    /**
     * Process grammar files into a grammar object
     * @param {String} file - Grammar file content
     * @param {String} lexFile - Lexical grammar file content (optional)
     * @param {Boolean} jsonMode - Whether to process as JSON
     * @returns {Object} - Processed grammar
     */
    processGrammars(file, lexFile, jsonMode) {
        lexFile = lexFile || false;
        jsonMode = jsonMode || false;
        
        const ebnfParser = require('ebnf-parser');
        const cjson = require('cjson');
        
        let grammar;
        try {
            if (jsonMode) {
                grammar = cjson.parse(file);
            } else {
                grammar = ebnfParser.parse(file);
            }
        } catch (e) {
            throw new Error('Could not parse jison grammar');
        }
        
        try {
            if (lexFile) {
                grammar.lex = require('lex-parser').parse(lexFile);
            }
        } catch (e) {
            throw new Error('Could not parse lex grammar');
        }
        
        return grammar;
    }
    
    /**
     * Generate parser code string
     * @param {Object} opts - Command line options
     * @param {Object} grammar - Grammar object
     * @returns {String} - Generated parser code
     */
    generateParserString(opts, grammar) {
        opts = opts || {};
        const settings = buildSettings(opts, grammar.options);
        
        // Convert to Grammar object if it isn't already
        const grammarObj = grammar instanceof Grammar ? grammar : new Grammar(grammar);
        
        // Use factory to create the appropriate parser
        const generator = ParserFactory.createParser(grammarObj, settings);
        return generator.generate(settings);
    }
}

module.exports = GrammarProcessor;