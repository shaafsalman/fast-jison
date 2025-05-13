/**
 * lib/core/nonterminal.js
 * 
 * Represents a non-terminal symbol in a grammar
 * 
 * Refactorings applied:
 * - Extract Class: Extracted from jison.js
 * - Move Method: Moved relevant methods from generator
 */

"use strict";

const { Set } = require('../util/set');

/**
 * Represents a non-terminal symbol in a grammar
 */
class Nonterminal {
    /**
     * Create a new non-terminal
     * @param {String} symbol - The symbol name
     */
    constructor(symbol) {
        this.symbol = symbol;
        this.productions = new Set();
        this.first = [];
        this.follows = [];
        this.nullable = false;
    }
    
    /**
     * Add a production to this non-terminal
     * @param {Object} production - Production to add
     */
    addProduction(production) {
        this.productions.push(production);
    }
    
    /**
     * Get a string representation of the non-terminal
     * @returns {String} String representation
     */
    toString() {
        let str = this.symbol + "\n";
        str += (this.nullable ? 'nullable' : 'not nullable');
        str += "\nFirsts: " + this.first.join(', ');
        str += "\nFollows: " + this.follows.join(', ');
        str += "\nProductions:\n  " + this.productions.join('\n  ');
        
        return str;
    }
}

module.exports = Nonterminal;