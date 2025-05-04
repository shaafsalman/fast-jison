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
var typal = require('../util/typal').typal;

// LR(0) Parser mixin
var lr0Mixin = {
    type: "LR(0)",
    
    afterconstructor: function lr0_afterconstructor() {
        this.buildTable();
    }
};

// Create LR0 generator by combining mixins
var LR0Generator = typal.construct({});
typal.mix.call(LR0Generator.prototype, 
    generator, 
    lookaheadMixin, 
    lrGeneratorMixin, 
    lr0Mixin
);

module.exports = LR0Generator;