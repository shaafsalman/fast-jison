/*
 * File: lib/generators/lr0-generator.js
 * Source: Extracted from jison.js
 * Refactorings applied: 
 * - Extract Class (LR0Generator)
 * - Move Method (LR0 generation)
 * - Extract Subclass
 * 
 * Functionality: LR(0) parser generator
 */

var generator = require('./generator-base');
var lookaheadMixin = require('../util/lookahead-mixin').lookaheadMixin;
var lrGeneratorMixin = require('../util/lr-generator-mixin').lrGeneratorMixin;

// LR(0) Parser
var lr0 = generator.beget(lookaheadMixin, lrGeneratorMixin, {
    type: "LR(0)",
    
    afterconstructor: function lr0_afterconstructor() {
        this.buildTable();
    }
});

// Constructor
var LR0Generator = lr0.construct();

module.exports = LR0Generator;