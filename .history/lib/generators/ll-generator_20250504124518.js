/*
 * File: lib/generators/ll-generator.js
 * Source: Extracted from jison.js
 * Refactorings applied: 
 * - Extract Class (LLGenerator)
 * - Move Method (LL generation)
 * - Extract Subclass
 * 
 * Functionality: LL(1) parser generator
 */

var generator = require('./generator-base');
var lookaheadMixin = require('../util/lookahead-mixin').lookaheadMixin;
var Set = require('../util/set').Set;

// LL Parser
var ll = generator.beget(lookaheadMixin, {
    type: "LL(1)",

    afterconstructor: function ll_aftercontructor() {
        this.computeLookaheads();
        this.table = this.parseTable(this.productions);
    },
    
    parseTable: function llParseTable(productions) {
        var table = {},
            self = this;
        productions.forEach(function(production, i) {
            var row = table[production.symbol] || {};
            var tokens = production.first;
            if (self.nullable(production.handle)) {
                Set.union(tokens, self.nonterminals[production.symbol].follows);
            }
            tokens.forEach(function(token) {
                if (row[token]) {
                    row[token].push(i);
                    self.conflicts++;
                } else {
                    row[token] = [i];
                }
            });
            table[production.symbol] = row;
        });

        return table;
    }
});

// Constructor
var LLGenerator = ll.construct();

module.exports = LLGenerator;