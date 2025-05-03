/**
 * lib/core/production.js
 * 
 * Represents a production rule in a grammar
 * 
 * Refactorings applied:
 * - Extract Class: Extracted from jison.js
 * - Move Method: Moved relevant methods from generator
 */

"use strict";

/**
 * Represents a production rule in a grammar
 */
class Production {
    /**
     * Create a new production
     * @param {String} symbol - Non-terminal symbol name
     * @param {Array} handle - Right-hand side of the production
     * @param {Number} id - Production ID
     */
    constructor(symbol, handle, id) {
        this.symbol = symbol;
        this.handle = handle;
        this.id = id;
        this.nullable = false;
        this.first = [];
        this.precedence = 0;
    }
    
    /**
     * Check if this production has the specified precedence
     * @param {Object} operators - Operator definitions
     */
    setPrecedenceFromOperators(operators) {
        if (this.precedence === 0) {
            // Set precedence based on rightmost terminal with a precedence
            for (let i = this.handle.length - 1; i >= 0; i--) {
                const symbol = this.handle[i];
                if (operators[symbol]) {
                    this.precedence = operators[symbol].precedence;
                    break;
                }
            }
        }
    }
    
    /**
     * Get a string representation of the production
     * @returns {String} String representation
     */
    toString() {
        return this.symbol + " -> " + this.handle.join(' ');
    }
}

module.exports = Production;