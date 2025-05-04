/*
 * File: lib/core/nonterminal.js
 * Source: Extracted from jison.js
 * Refactorings applied: 
 * - Extract Class (Nonterminal)
 * - Move Method (nonterminal-related functionality)
 * 
 * Functionality: Represents a nonterminal symbol in a grammar
 */

var typal = require("../util/typal").typal;
var Set = require("../util/set").Set;

var Nonterminal = typal.construct({
    constructor: function Nonterminal(symbol) {
        this.symbol = symbol;
        this.productions = new Set();
        this.first = [];
        this.follows = [];
        this.nullable = false;
    },
    
    toString: function Nonterminal_toString() {
        var str = this.symbol + "\n";
        str += (this.nullable ? 'nullable' : 'not nullable');
        str += "\nFirsts: " + this.first.join(', ');
        str += "\nFollows: " + this.first.join(', ');
        str += "\nProductions:\n  " + this.productions.join('\n  ');

        return str;
    }
});

exports.Nonterminal = Nonterminal;