/*
 * File: lib/common/helpers.js
 * 
 * Refactorings applied:
 * - Extract Method: Moved utility functions to dedicated file
 * - Inline Method: Combined closely related functionality
 * - Simplifying Conditional Expressions: Clarified logic
 * 
 * Functionality: Provides helper functions used across the Jison codebase
 */

var constants = require('./constants');

// Iterate over objects or arrays
exports.each = function each(obj, func) {
    if (obj.forEach) {
        obj.forEach(func);
    } else {
        for (var p in obj) {
            if (obj.hasOwnProperty(p)) {
                func.call(obj, obj[p], p, obj);
            }
        }
    }
};

// Find states with only one action, a reduction
exports.findDefaults = function findDefaults(states) {
    var defaults = {};
    var REDUCE = constants.REDUCE;

    states.forEach(function(state, k) {
        var i = 0;
        var lastAction;
        
        for (var act in state) {
            if (Object.hasOwnProperty.call(state, act)) {
                lastAction = act;
                i++;
            }
        }

        if (i === 1 && state[lastAction][0] === REDUCE) {
            // Only one action in state and it's a reduction
            defaults[k] = state[lastAction];
        }
    });

    return defaults;
};

// Process operators to set precedence and associativity
exports.processOperators = function processOperators(ops) {
    if (!ops) return {};
    
    var operators = {};
    for (var i=0, k, prec; prec=ops[i]; i++) {
        for (k=1; k < prec.length; k++) {
            operators[prec[k]] = {
                precedence: i+1, 
                assoc: prec[0]
            };
        }
    }
    
    return operators;
};

// Create an appropriate function for importing modules in a Node.js environment
exports.commonjsMain = function commonjsMain(args) {
    if (!args[1]) {
        console.log('Usage: ' + args[0] + ' FILE');
        process.exit(1);
    }
    var source = require('fs').readFileSync(require('path').normalize(args[1]), "utf8");
    return exports.parser.parse(source);
};

// Print an action (for debugging purposes)
exports.printAction = function printAction(a, gen) {
    var s;
    if (a[0] == constants.SHIFT) {
        s = 'shift token (then go to state ' + a[1] + ')';
    } else if (a[0] == constants.REDUCE) {
        s = 'reduce by rule: ' + gen.productions[a[1]];
    } else {
        s = 'accept';
    }
    
    return s;
};