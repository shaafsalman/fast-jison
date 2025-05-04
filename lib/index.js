/*
 * File: lib/index.js
 * Source: Reconstructed from jison.js
 * Refactorings applied: 
 *   - Extract Class: Main functionality in its own file
 *   - Consolidate Conditional Expressions: Simplified parser creation
 * Functionality: Main entry point for Jison parser generator
 */

var LR0Generator = require('./generators/LR0Generator').LR0Generator;
var SLRGenerator = require('./generators/SLRGenerator').SLRGenerator;
var LR1Generator = require('./generators/LR1Generator').LR1Generator;
var LALRGenerator = require('./generators/LALRGenerator').LALRGenerator;
var LLGenerator = require('./generators/LLGenerator').LLGenerator;

var Jison = exports.Jison = exports;

// detect print
if (typeof console !== 'undefined' && console.log) {
    Jison.print = console.log;
} else if (typeof puts !== 'undefined') {
    Jison.print = function print() { puts([].join.call(arguments, ' ')); };
} else if (typeof print !== 'undefined') {
    Jison.print = print;
} else {
    Jison.print = function print() {};
}

// Main generator factory
Jison.Generator = function Jison_Generator(g, options) {
    var opt = {};
    for (var key in g.options || {}) opt[key] = g.options[key];
    for (var key in options || {}) opt[key] = options[key];
    
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

// Main parser factory
Jison.Parser = function Parser(g, options) {
    var gen = Jison.Generator(g, options);
    return gen.createParser();
};

// Export version from package.json
Jison.version = require('../package.json').version;