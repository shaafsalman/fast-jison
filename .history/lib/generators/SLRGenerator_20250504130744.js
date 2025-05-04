/*
 * File: lib/generators/SLRGenerator.js
 * Source: Extracted from jison.js
 * Refactorings applied: 
 *   - Extract Class: Separated SLR generator functionality
 *   - Consolidate Conditional Expressions: Simplified lookAheads method
 * Functionality: SLR Parser Generator
 */

var lrGeneratorMixin = require('../parsers/LRParser').lrGeneratorMixin;
var lookaheadMixin = require('../parsers/LRParser').lookaheadMixin;
var typal = require('../utils/Typal').typal;

/*
 * SLR Parser
 * */
var lrLookaheadGenerator = typal.beget(lookaheadMixin, lrGeneratorMixin, {
    afterconstructor: function lr_aftercontructor() {
        this.computeLookaheads();
        this.buildTable();
    }
});

var SLRGenerator = lrLookaheadGenerator.construct({
    type: "SLR(1)",

    lookAheads: function SLR_lookAhead(state, item) {
        return this.nonterminals[item.production.symbol].follows;
    }
});

exports.SLRGenerator = SLRGenerator;