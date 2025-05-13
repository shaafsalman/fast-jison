/*
 * File: lib/generators/lr1-generator.js
 * Source: Extracted from jison.js
 * Refactorings applied: 
 * - Extract Class (LR1Generator)
 * - Move Method (LR1 generation)
 * - Extract Subclass
 * 
 * Functionality: LR(1) parser generator
 */

var generator = require('./generator-base');
var lookaheadMixin = require('../util/lookahead-mixin').lookaheadMixin;
var lrGeneratorMixin = require('../util/lr-generator-mixin').lrGeneratorMixin;
var Set = require('../util/set').Set;
var Item = require('../core/item').Item;

// LR(1) Parser
var lr1 = generator.beget(lookaheadMixin, lrGeneratorMixin, {
    type: "Canonical LR(1)",

    lookAheads: function LR_lookAheads(state, item) {
        return item.follows;
    },
    
    Item: Item.construct({
        afterconstructor: function() {
            this.id = this.production.id + 'a' + this.dotPosition + 'a' + this.follows.sort().join(',');
        },
        eq: function(e) {
            return e.id === this.id;
        }
    }),

    closureOperation: function LR_ClosureOperation(itemSet) {
        var closureSet = new this.ItemSet();
        var self = this;

        var set = itemSet,
            itemQueue, syms = {};

        do {
            itemQueue = new Set();
            closureSet.concat(set);
            set.forEach(function(item) {
                var symbol = item.markedSymbol;
                var b, r;

                // If token is a nonterminal, recursively add closures
                if (symbol && self.nonterminals[symbol]) {
                    r = item.remainingHandle();
                    b = self.first(item.remainingHandle());
                    if (b.length === 0 || item.production.nullable || self.nullable(r)) {
                        b = b.concat(item.follows);
                    }
                    self.nonterminals[symbol].productions.forEach(function(production) {
                        var newItem = new self.Item(production, 0, b);
                        if (!closureSet.contains(newItem) && !itemQueue.contains(newItem)) {
                            itemQueue.push(newItem);
                        }
                    });
                } else if (!symbol) {
                    // Reduction
                    closureSet.reductions.push(item);
                }
            });

            set = itemQueue;
        } while (!itemQueue.isEmpty());

        return closureSet;
    }
});

// Constructor
var LR1Generator = lr1.construct();

module.exports = LR1Generator;