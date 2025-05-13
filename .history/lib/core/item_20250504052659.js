/*
 * File: lib/core/item.js
 * Source: Extracted from jison.js
 * Refactorings applied: 
 * - Extract Class (Item)
 * - Move Method (item-related functionality)
 * 
 * Functionality: Represents an LR item in the parsing algorithm
 */

var typal = require("../util/typal").typal;

var Item = typal.construct({
    constructor: function Item(production, dot, f, predecessor) {
        this.production = production;
        this.dotPosition = dot || 0;
        this.follows = f || [];
        this.predecessor = predecessor;
        this.id = parseInt(production.id + 'a' + this.dotPosition, 36);
        this.markedSymbol = this.production.handle[this.dotPosition];
    },
    
    remainingHandle: function() {
        return this.production.handle.slice(this.dotPosition + 1);
    },
    
    eq: function(e) {
        return e.id === this.id;
    },
    
    handleToString: function() {
        var handle = this.production.handle.slice(0);
        handle[this.dotPosition] = '.' + (handle[this.dotPosition] || '');
        return handle.join(' ');
    },
    
    toString: function() {
        var temp = this.production.handle.slice(0);
        temp[this.dotPosition] = '.' + (temp[this.dotPosition] || '');
        return this.production.symbol + " -> " + temp.join(' ') +
            (this.follows.length === 0 ? "" : " #lookaheads= " + this.follows.join(' '));
    }
});

exports.Item = Item;