/*
 * File: lib/core/production.js
 * Source: Extracted from jison.js
 * Refactorings applied: 
 * - Extract Class (Production)
 * - Move Method (production-related functionality)
 * 
 * Functionality: Represents a grammar production
 */

var typal = require("../util/typal").typal;

var Production = typal.construct({
    constructor: function Production(symbol, handle, id) {
        this.symbol = symbol;
        this.handle = handle;
        this.nullable = false;
        this.id = id;
        this.first = [];
        this.precedence = 0;
    },
    
    toString: function Production_toString() {
        return this.symbol + " -> " + this.handle.join(' ');
    }
});

exports.Production = Production;