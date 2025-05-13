/*
 * File: lib/generators/LLGenerator.js
 * Source: Extracted from jison.js
 * Refactorings applied: 
 *   - Extract Class: Separated LL generator functionality
 *   - Consolidate Conditional Expressions: Simplified methods
 * Functionality: LL Parser Generator
 */

var generator = require('../core/Generator').generator;
var lookaheadMixin = require('../parsers/LRParser').lookaheadMixin;
var typal = require('../utils/Typal').typal;
var Set = require('../utils/Set').Set;

/*
 * LL Parser
 * */
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

exports.LLGenerator = ll.construct();