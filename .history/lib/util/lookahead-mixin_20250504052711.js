/*
 * File: lib/util/lookahead-mixin.js
 * Source: Extracted from jison.js
 * Refactorings applied: 
 * - Extract Class (lookaheadMixin)
 * - Move Method (lookahead computation)
 * 
 * Functionality: Provides lookahead computation methods for parsers
 */

var Set = require("./set").Set;

var lookaheadMixin = {
    computeLookaheads: function computeLookaheads() {
        if (this.DEBUG) this.mix(require('./debug-mixins').lookaheadDebug);

        this.computeLookaheads = function() {};
        this.nullableSets();
        this.firstSets();
        this.followSets();
    },

    // Calculate follow sets based on first and nullable
    followSets: function followSets() {
        var productions = this.productions,
            nonterminals = this.nonterminals,
            self = this,
            cont = true;

        // Loop until no further changes have been made
        while (cont) {
            cont = false;

            productions.forEach(function Follow_prod_forEach(production, k) {
                var q;
                var ctx = !!self.go_;

                var set = [], oldcount;
                for (var i = 0, t; t = production.handle[i]; ++i) {
                    if (!nonterminals[t]) continue;

                    // For Simple LALR algorithm, check context
                    if (ctx)
                        q = self.go_(production.symbol, production.handle.slice(0, i));
                    var bool = !ctx || q === parseInt(self.nterms_[t], 10);

                    if (i === production.handle.length + 1 && bool) {
                        set = nonterminals[production.symbol].follows;
                    } else {
                        var part = production.handle.slice(i + 1);

                        set = self.first(part);
                        if (self.nullable(part) && bool) {
                            set.push.apply(set, nonterminals[production.symbol].follows);
                        }
                    }
                    oldcount = nonterminals[t].follows.length;
                    Set.union(nonterminals[t].follows, set);
                    if (oldcount !== nonterminals[t].follows.length) {
                        cont = true;
                    }
                }
            });
        }
    },

    // Return the FIRST set of a symbol or series of symbols
    first: function first(symbol) {
        // Epsilon
        if (symbol === '') {
            return [];
        // RHS
        } else if (symbol instanceof Array) {
            var firsts = [];
            for (var i = 0, t; t = symbol[i]; ++i) {
                if (!this.nonterminals[t]) {
                    if (firsts.indexOf(t) === -1)
                        firsts.push(t);
                } else {
                    Set.union(firsts, this.nonterminals[t].first);
                }
                if (!this.nullable(t))
                    break;
            }
            return firsts;
        // Terminal
        } else if (!this.nonterminals[symbol]) {
            return [symbol];
        // Nonterminal
        } else {
            return this.nonterminals[symbol].first;
        }
    },

    // Fixed-point calculation of FIRST sets
    firstSets: function firstSets() {
        var productions = this.productions,
            nonterminals = this.nonterminals,
            self = this,
            cont = true,
            symbol, firsts;

        // Loop until no further changes have been made
        while (cont) {
            cont = false;

            productions.forEach(function FirstSets_forEach(production, k) {
                var firsts = self.first(production.handle);
                if (firsts.length !== production.first.length) {
                    production.first = firsts;
                    cont = true;
                }
            });

            for (symbol in nonterminals) {
                firsts = [];
                nonterminals[symbol].productions.forEach(function(production) {
                    Set.union(firsts, production.first);
                });
                if (firsts.length !== nonterminals[symbol].first.length) {
                    nonterminals[symbol].first = firsts;
                    cont = true;
                }
            }
        }
    },

    // Fixed-point calculation of NULLABLE
    nullableSets: function nullableSets() {
        var firsts = this.firsts = {},
            nonterminals = this.nonterminals,
            self = this,
            cont = true;

        // Loop until no further changes have been made
        while (cont) {
            cont = false;

            // Check if each production is nullable
            this.productions.forEach(function(production, k) {
                if (!production.nullable) {
                    for (var i = 0, n = 0, t; t = production.handle[i]; ++i) {
                        if (self.nullable(t)) n++;
                    }
                    if (n === i) { // Production is nullable if all tokens are nullable
                        production.nullable = cont = true;
                    }
                }
            });

            // Check if each symbol is nullable
            for (var symbol in nonterminals) {
                if (!this.nullable(symbol)) {
                    for (var i = 0, production; production = nonterminals[symbol].productions.item(i); i++) {
                        if (production.nullable)
                            nonterminals[symbol].nullable = cont = true;
                    }
                }
            }
        }
    },

    // Check if a token or series of tokens is nullable
    nullable: function nullable(symbol) {
        // Epsilon
        if (symbol === '') {
            return true;
        // RHS
        } else if (symbol instanceof Array) {
            for (var i = 0, t; t = symbol[i]; ++i) {
                if (!this.nullable(t))
                    return false;
            }
            return true;
        // Terminal
        } else if (!this.nonterminals[symbol]) {
            return false;
        // Nonterminal
        } else {
            return this.nonterminals[symbol].nullable;
        }
    }
};

exports.lookaheadMixin = lookaheadMixin;