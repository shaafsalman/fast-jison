/*
 * File: lib/generators/lalr-generator.js
 * Source: Extracted from jison.js
 * Refactorings applied: 
 * - Extract Class (LALRGenerator)
 * - Move Method (LALR generation)
 * - Extract Subclass
 * 
 * Functionality: LALR(1) parser generator
 */

var generator = require('./generator-base');
var lookaheadMixin = require('../util/lookahead-mixin').lookaheadMixin;
var lrGeneratorMixin = require('../util/lr-generator-mixin').lrGeneratorMixin;
var Set = require('../util/set').Set;

// Simple LALR(1)
var lalr = generator.beget(lookaheadMixin, lrGeneratorMixin, {
    type: "LALR(1)",

    afterconstructor: function(grammar, options) {
        if (this.DEBUG) this.mix(require('../util/debug-mixins').lrGeneratorDebug); // Mixin debug methods

        options = options || {};
        this.states = this.canonicalCollection();
        this.terms_ = {};

        var newg = this.newg = typal.beget(lookaheadMixin, {
            oldg: this,
            trace: this.trace,
            nterms_: {},
            DEBUG: false,
            go_: function(r, B) {
                r = r.split(":")[0]; // Grab state #
                B = B.map(function(b) { return b.slice(b.indexOf(":") + 1); });
                return this.oldg.go(r, B);
            }
        });
        newg.nonterminals = {};
        newg.productions = [];

        this.inadequateStates = [];

        // If true, only lookaheads in inadequate states are computed (faster, larger table)
        // If false, lookaheads for all reductions will be computed (slower, smaller table)
        this.onDemandLookahead = options.onDemandLookahead || false;

        this.buildNewGrammar();
        newg.computeLookaheads();
        this.unionLookaheads();

        this.table = this.parseTable(this.states);
        this.defaultActions = findDefaults(this.table);
    },

    lookAheads: function LALR_lookaheads(state, item) {
        return (!!this.onDemandLookahead && !state.inadequate) ? this.terminals : item.follows;
    },
    
    go: function LALR_go(p, w) {
        var q = parseInt(p, 10);
        for (var i = 0; i < w.length; i++) {
            q = this.states.item(q).edges[w[i]] || q;
        }
        return q;
    },
    
    goPath: function LALR_goPath(p, w) {
        var q = parseInt(p, 10), t,
            path = [];
        for (var i = 0; i < w.length; i++) {
            t = w[i] ? q + ":" + w[i] : '';
            if (t) this.newg.nterms_[t] = q;
            path.push(t);
            q = this.states.item(q).edges[w[i]] || q;
            this.terms_[t] = w[i];
        }
        return {path: path, endState: q};
    },
    
    // Every disjoint reduction of a nonterminal becomes a production in G'
    buildNewGrammar: function LALR_buildNewGrammar() {
        var self = this,
            newg = this.newg;

        this.states.forEach(function(state, i) {
            state.forEach(function(item) {
                if (item.dotPosition === 0) {
                    // New symbols are a combination of state and transition symbol
                    var symbol = i + ":" + item.production.symbol;
                    self.terms_[symbol] = item.production.symbol;
                    newg.nterms_[symbol] = i;
                    if (!newg.nonterminals[symbol])
                        newg.nonterminals[symbol] = new Nonterminal(symbol);
                    var pathInfo = self.goPath(i, item.production.handle);
                    var p = new Production(symbol, pathInfo.path, newg.productions.length);
                    newg.productions.push(p);
                    newg.nonterminals[symbol].productions.push(p);

                    // Store the transition that get's 'backed up to' after reduction on path
                    var handle = item.production.handle.join(' ');
                    var goes = self.states.item(pathInfo.endState).goes;
                    if (!goes[handle])
                        goes[handle] = [];
                    goes[handle].push(symbol);
                }
            });
            if (state.inadequate)
                self.inadequateStates.push(i);
        });
    },
    
    unionLookaheads: function LALR_unionLookaheads() {
        var self = this,
            newg = this.newg,
            states = !!this.onDemandLookahead ? this.inadequateStates : this.states;

        states.forEach(function union_states_forEach(i) {
            var state = typeof i === 'number' ? self.states.item(i) : i,
                follows = [];
            if (state.reductions.length)
            state.reductions.forEach(function union_reduction_forEach(item) {
                var follows = {};
                for (var k = 0; k < item.follows.length; k++) {
                    follows[item.follows[k]] = true;
                }
                state.goes[item.production.handle.join(' ')].forEach(function reduction_goes_forEach(symbol) {
                    newg.nonterminals[symbol].follows.forEach(function goes_follows_forEach(symbol) {
                        var terminal = self.terms_[symbol];
                        if (!follows[terminal]) {
                            follows[terminal] = true;
                            item.follows.push(terminal);
                        }
                    });
                });
            });
        });
    }
});

// Helper function to find default actions
function findDefaults(states) {
    var defaults = {};
    states.forEach(function(state, k) {
        var i = 0;
        for (var act in state) {
            if ({}.hasOwnProperty.call(state, act)) i++;
        }

        if (i === 1 && state[act][0] === 2) {
            // Only one action in state and it's a reduction
            defaults[k] = state[act];
        }
    });

    return defaults;
}

// Constructor
var LALRGenerator = lalr.construct();

module.exports = LALRGenerator;