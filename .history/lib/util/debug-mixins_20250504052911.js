/*
 * File: lib/util/debug-mixins.js
 * Source: Extracted from jison.js
 * Refactorings applied: 
 * - Extract Class (debug mixins)
 * - Move Method (debug functionality)
 * 
 * Functionality: Provides debug mixins for generators
 */

// Generic debug mixin for generators
var generatorDebug = {
    trace: function trace() {
        console.log.apply(null, arguments);
    },
    
    beforeprocessGrammar: function() {
        this.trace("Processing grammar.");
    },
    
    afteraugmentGrammar: function() {
        var trace = this.trace;
        each(this.symbols, function(sym, i) {
            trace(sym + "(" + i + ")");
        });
    }
};

// Lookahead debug mixin
var lookaheadDebug = {
    beforenullableSets: function() {
        this.trace("Computing Nullable sets.");
    },
    
    beforefirstSets: function() {
        this.trace("Computing First sets.");
    },
    
    beforefollowSets: function() {
        this.trace("Computing Follow sets.");
    },
    
    afterfollowSets: function() {
        var trace = this.trace;
        for (var ntName in this.nonterminals) {
            trace(this.nonterminals[ntName], '\n');
        }
    }
};

// LR generator debug mixin
var lrGeneratorDebug = {
    beforeparseTable: function() {
        this.trace("Building parse table.");
    },
    
    afterparseTable: function() {
        var self = this;
        if (this.conflicts > 0) {
            this.resolutions.forEach(function(r, i) {
                if (r[2].bydefault) {
                    self.warn('Conflict at state: ', r[0], ', token: ', r[1], "\n  ", printAction(r[2].r, self), "\n  ", printAction(r[2].s, self));
                }
            });
            this.trace("\n" + this.conflicts + " Conflict(s) found in grammar.");
        }
        this.trace("Done.");
    },
    
    aftercanonicalCollection: function(states) {
        var trace = this.trace;
        trace("\nItem sets\n------");

        states.forEach(function(state, i) {
            trace("\nitem set", i, "\n" + state.join("\n"), '\ntransitions -> ', JSON.stringify(state.edges));
        });
    }
};

// Helper function for debug output
function printAction(a, gen) {
    var s = a[0] == 1 ? 'shift token (then go to state ' + a[1] + ')' :
        a[0] == 2 ? 'reduce by rule: ' + gen.productions[a[1]] :
                    'accept';

    return s;
}

// Helper function for iterating over objects
function each(obj, func) {
    if (obj.forEach) {
        obj.forEach(func);
    } else {
        var p;
        for (p in obj) {
            if (obj.hasOwnProperty(p)) {
                func.call(obj, obj[p], p, obj);
            }
        }
    }
}

exports.generatorDebug = generatorDebug;
exports.lookaheadDebug = lookaheadDebug;
exports.lrGeneratorDebug = lrGeneratorDebug;
exports.each = each;