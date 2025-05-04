/*
 * File: lib/generators/slr-generator.js
 * Source: Extracted from jison.js
 * Refactorings applied: 
 * - Extract Class (SLRGenerator)
 * - Move Method (SLR generation)
 * - Extract Subclass
 * 
 * Functionality: SLR(1) parser generator
 */

var generator = require('./generator-base');
var lookaheadMixin = require('../util/lookahead-mixin').lookaheadMixin;
var lrGeneratorMixin = require('../util/lr-generator-mixin').lrGeneratorMixin;

// SLR Parser
var SLRGenerator = lrGeneratorMixin.beget(lookaheadMixin, lrGeneratorMixin, {
    type: "SLR(1)",

    lookAheads: function SLR_lookAhead(state, item) {
        return this.nonterminals[item.production.symbol].follows;
    }
}).construct();

module.exports = SLRGenerator;