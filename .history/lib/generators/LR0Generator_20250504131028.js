/*
 * File: lib/generators/LR0Generator.js
 * Source: Extracted from jison.js
 * Refactorings applied: 
 *   - Extract Class: Separated LR0 generator functionality
 *   - Consolidate Conditional Expressions: Simplified constructor
 * Functionality: LR(0) Parser Generator
 */

var generator = require('../core/Generator').generator;
var lrGeneratorMixin = require('../parsers/LRParser').lrGeneratorMixin;
var lookaheadMixin = require('../parsers/LRParser').lookaheadMixin;
var typal = require('../utils/Typal').typal;

// LR(0) Parser
var lr0 = generator.beget(lookaheadMixin, lrGeneratorMixin, {
    type: "LR(0)",
    afterconstructor: function lr0_afterconstructor() {
        this.buildTable();
    }
});

exports.LR0Generator = lr0.construct();