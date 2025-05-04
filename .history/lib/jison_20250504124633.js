/*
 * File: lib/jison.js
 * Source: Original jison.js
 * Refactorings applied: 
 * - Extract Class (Jison)
 * - Replace Type Code with Strategy (generator types)
 * - Replace Constructor with Factory Method
 * 
 * Functionality: Main entry point for Jison
 */

// Jison, an LR(0), SLR(1), LARL(1), LR(1) Parser Generator
// Zachary Carter <zach@carter.name>
// MIT X Licensed

var Jison = exports;
Jison.version = require('../package.json').version;

// Utils
var LR0Generator = require('./generators/lr0-generator');
var SLRGenerator = require('./generators/slr-generator');
var LALRGenerator = require('./generators/lalr-generator');
var LR1Generator = require('./generators/lr1-generator');
var LLGenerator = require('./generators/ll-generator');

// Detect print function
if (typeof console !== 'undefined' && console.log) {
    Jison.print = console.log;
} else if (typeof puts !== 'undefined') {
    Jison.print = function print() { puts([].join.call(arguments, ' ')); };
} else if (typeof print !== 'undefined') {
    Jison.print = print;
} else {
    Jison.print = function print() {};
}

// Factory method for parser generator
Jison.Generator = function Generator(g, options) {
    var opt = options || {};
    switch (opt.type) {
        case 'lr0':
            return new LR0Generator(g, opt);
        case 'slr':
            return new SLRGenerator(g, opt);
        case 'lr':
            return new LR1Generator(g, opt);
        case 'll':
            return new LLGenerator(g, opt);
        default:
            return new LALRGenerator(g, opt);
    }
};

// Create a parser from a grammar
Jison.Parser = function Parser(g, options) {
    var gen = Jison.Generator(g, options);
    return gen.createParser();
};

module.exports = Jison;