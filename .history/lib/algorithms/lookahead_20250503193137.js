/**
 * lib/algorithms/lookahead.js
 * 
 * Handles lookahead calculations for parsers
 * 
 * Refactorings applied:
 * - Extract Class: Extracted lookahead functionality from jison.js
 * - Replace Inheritance with Delegation: Using composition over inheritance
 */

"use strict";

const { Set } = require('../util/set');

/**
 * Computes lookahead sets for grammars
 */
class LookaheadCalculator {
    /**
     * Create a new LookaheadCalculator
     * @param {Object} grammar - Grammar object with nonterminals and productions
     * @param {Object} options - Calculation options
     */
    constructor(grammar, options = {}) {
        this.nonterminals = grammar.nonterminals;
        this.productions = grammar.productions;
        this.options = options;
        this.firsts = {};
        this.DEBUG = options.debug || false;
        
        // Add debug methods if in debug mode
        if (this.DEBUG) {
            this.beforenullableSets = function() {
                this.trace("Computing Nullable sets.");
            };
            
            this.beforefirstSets = function() {
                this.trace("Computing First sets.");
            };
            
            this.beforefollowSets = function() {
                this.trace("Computing Follow sets.");
            };
            
            this.afterfollowSets = function() {
                for (const nt in this.nonterminals) {
                    this.trace(this.nonterminals[nt], '\n');
                }
            };
        }
    }
    
    /**
     * Compute all lookahead sets
     */
    computeLookaheads() {
        if (this.DEBUG && this.beforenullableSets) this.beforenullableSets();
        this.nullableSets();
        
        if (this.DEBUG && this.beforefirstSets) this.beforefirstSets();
        this.firstSets();
        
        if (this.DEBUG && this.beforefollowSets) this.beforefollowSets();
        this.followSets();
        
        if (this.DEBUG && this.afterfollowSets) this.afterfollowSets();
    }
    
    /**
     * Calculate follow sets based on first and nullable
     */
    followSets() {
        const productions = this.productions;
        const nonterminals = this.nonterminals;
        const self = this;
        let cont = true;
        
        // Loop until no further changes have been made
        while (cont) {
            cont = false;
            
            productions.forEach((production) => {
                // q is used in Simple LALR algorithm determine follows in context
                let q;
                const ctx = !!self.go_;
                
                let set = [], oldcount;
                for (let i = 0, t; t = production.handle[i]; ++i) {
                    if (!nonterminals[t]) continue;
                    
                    // For Simple LALR algorithm, self.go_ checks if
                    if (ctx) {
                        q = self.go_(production.symbol, production.handle.slice(0, i));
                    }
                    const bool = !ctx || q === parseInt(self.nterms_[t], 10);
                    
                    if (i === production.handle.length + 1 && bool) {
                        set = nonterminals[production.symbol].follows;
                    } else {
                        const part = production.handle.slice(i + 1);
                        
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
    }
    
    /**
     * Return the FIRST set of a symbol or series of symbols
     * @param {String|Array} symbol - Symbol or symbols to get FIRST set for
     * @returns {Array} - FIRST set
     */
    first(symbol) {
        // Epsilon
        if (symbol === '') {
            return [];
        // RHS
        } else if (Array.isArray(symbol)) {
            let firsts = [];
            for (let i = 0, t; t = symbol[i]; ++i) {
                if (!this.nonterminals[t]) {
                    if (firsts.indexOf(t) === -1) {
                        firsts.push(t);
                    }
                } else {
                    Set.union(firsts, this.nonterminals[t].first);
                }
                if (!this.nullable(t)) {
                    break;
                }
            }
            return firsts;
        // Terminal
        } else if (!this.nonterminals[symbol]) {
            return [symbol];
        // Nonterminal
        } else {
            return this.nonterminals[symbol].first;
        }
    }
    
    /**
     * Fixed-point calculation of FIRST sets
     */
    firstSets() {
        const productions = this.productions;
        const nonterminals = this.nonterminals;
        const self = this;
        let cont = true;
        let symbol, firsts;
        
        // Loop until no further changes have been made
        while (cont) {
            cont = false;
            
            productions.forEach((production) => {
                const firsts = self.first(production.handle);
                if (firsts.length !== production.first.length) {
                    production.first = firsts;
                    cont = true;
                }
            });
            
            for (symbol in nonterminals) {
                firsts = [];
                nonterminals[symbol].productions.forEach(production => {
                    Set.union(firsts, production.first);
                });
                if (firsts.length !== nonterminals[symbol].first.length) {
                    nonterminals[symbol].first = firsts;
                    cont = true;
                }
            }
        }
    }
    
    /**
     * Fixed-point calculation of NULLABLE
     */
    nullableSets() {
        const firsts = this.firsts = {};
        const nonterminals = this.nonterminals;
        const self = this;
        let cont = true;
        
        // Loop until no further changes have been made
        while (cont) {
            cont = false;
            
            // Check if each production is nullable
            this.productions.forEach(production => {
                if (!production.nullable) {
                    let n = 0;
                    for (let i = 0, t; t = production.handle[i]; ++i) {
                        if (self.nullable(t)) n++;
                    }
                    if (n === i) { // Production is nullable if all tokens are nullable
                        production.nullable = cont = true;
                    }
                }
            });
            
            // Check if each symbol is nullable
            for (let symbol in nonterminals) {
                if (!this.nullable(symbol)) {
                    for (let i = 0, production; production = nonterminals[symbol].productions.item(i); i++) {
                        if (production.nullable) {
                            nonterminals[symbol].nullable = cont = true;
                        }
                    }
                }
            }
        }
    }
    
    /**
     * Check if a token or series of tokens is nullable
     * @param {String|Array} symbol - Symbol or symbols to check
     * @returns {Boolean} - True if nullable
     */
    nullable(symbol) {
        // Epsilon
        if (symbol === '') {
            return true;
        // RHS
        } else if (Array.isArray(symbol)) {
            for (let i = 0, t; t = symbol[i]; ++i) {
                if (!this.nullable(t)) {
                    return false;
                }
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
    
    /**
     * Log a trace message when in debug mode
     * @param {...*} args - Message arguments
     */
    trace(...args) {
        if (this.DEBUG) {
            console.log(...args);
        }
    }
}

module.exports = LookaheadCalculator;