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
var typal = require('../util/typal').typal;

// SLR Parser
var slrGeneratorMixin = {
    type: "SLR(1)",

    lookAheads: function SLR_lookAhead(state, item) {
        return this.nonterminals[item.production.symbol].follows;
    }
};

// Create SLR generator by combining mixins
var SLRGenerator = typal.construct({});
typal.mix.call(SLRGenerator.prototype, 
    generator, 
    lookaheadMixin, 
    lrGeneratorMixin, 
    slrGeneratorMixin
);

module.exports = SLRGenerator;