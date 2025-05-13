// lib/util/symbol-table.js
// Refactored from jison.js
// Refactorings applied:
// - Replace Array with Object: Created a formal class to manage symbols and IDs
// - Extract Method: Separated symbol management functionality

"use strict";

/**
 * Manages symbols and their numeric identifiers
 */
class SymbolTable {
    /**
     * Create a new SymbolTable
     */
    constructor() {
        this.symbolToId = {}; // Maps symbol name to ID
        this.idToSymbol = {}; // Maps ID to symbol name
        this.symbols = [];    // List of all symbols in order
        this.nextId = 0;
    }

    /**
     * Add a symbol to the table
     * @param {String} symbol - Symbol to add
     * @returns {Number} - The ID of the symbol
     */
    add(symbol) {
        if (this.symbolToId[symbol] === undefined) {
            const id = this.nextId++;
            this.symbolToId[symbol] = id;
            this.idToSymbol[id] = symbol;
            this.symbols.push(symbol);
            return id;
        }
        return this.symbolToId[symbol];
    }

    /**
     * Get the ID for a symbol
     * @param {String} symbol - Symbol to look up
     * @returns {Number} - The ID of the symbol or undefined if not found
     */
    getId(symbol) {
        return this.symbolToId[symbol];
    }

    /**
     * Get the symbol for an ID
     * @param {Number} id - ID to look up
     * @returns {String} - The symbol for the ID or undefined if not found
     */
    getSymbol(id) {
        return this.idToSymbol[id];
    }

    /**
     * Check if the table contains a symbol
     * @param {String} symbol - Symbol to check
     * @returns {Boolean} - True if the symbol exists in the table
     */
    contains(symbol) {
        return this.symbolToId[symbol] !== undefined;
    }

    /**
     * Get the number of symbols in the table
     * @returns {Number} - The number of symbols
     */
    size() {
        return this.nextId;
    }
}

module.exports = SymbolTable;