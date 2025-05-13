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
var typal = require('../util/typal').typal;
var Set = require('../util/set').Set;

// LL Parser mixin
var llMixin = {
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
};

// Create LL generator by combining mixins
var LLGenerator = typal.construct({});
typal.mix.call(LLGenerator.prototype, 
    generator, 
    lookaheadMixin, 
    llMixin
);

module.exports = LLGenerator;