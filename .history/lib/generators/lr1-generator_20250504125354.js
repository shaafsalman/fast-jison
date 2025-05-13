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
var typal = require('../util/typal').typal;
var Set = require('../util/set').Set;
var Item = require('../core/item').Item;

// LR(1) Parser mixin
var lr1Mixin = {
    type: "Canonical LR(1)",

    lookAheads: function LR_lookAheads(state, item) {
        return item.follows;
    },
    
    // Override the Item constructor for LR(1)
    Item: typal.construct({
        constructor: function LR1Item(production, dot, f, predecessor) {
            this.production = production;
            this.dotPosition = dot || 0;
            this.follows = f || [];
            this.predecessor = predecessor;
            this.id = this.production.id + 'a' + this.dotPosition + 'a' + this.follows.sort().join(',');
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
};

// Create LR1 generator by combining mixins
var LR1Generator = typal.construct({});
typal.mix.call(LR1Generator.prototype, 
    generator, 
    lookaheadMixin, 
    lrGeneratorMixin, 
    lr1Mixin
);

module.exports = LR1Generator;