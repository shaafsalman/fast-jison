// lib/core/grammar.js
// Refactored from jison.js
// Refactorings applied:
// - Extract Class: Created a Grammar class from jison.js generator logic
// - Move Method: Moved processOperators from generator to Grammar
// - Replace Array with Object: Added proper property structure for grammar components

"use strict";

var ebnfParser = require('ebnf-parser');

/**
 * Grammar class representing the syntactic structure for parsing
 */
class Grammar {
    /**
     * Create a new Grammar instance
     * @param {Object} grammarSpec - Grammar specification
     */
    constructor(grammarSpec) {
        // Convert string grammars to object format
        if (typeof grammarSpec === 'string') {
            grammarSpec = ebnfParser.parse(grammarSpec);
        }

        this.bnf = grammarSpec.bnf;
        this.ebnf = grammarSpec.ebnf;
        this.tokens = this._processTokens(grammarSpec.tokens);
        this.operators = this._processOperators(grammarSpec.operators);
        this.start = grammarSpec.start || grammarSpec.startSymbol;
        this.options = grammarSpec.options || {};
        this.parseParams = grammarSpec.parseParams;
        
        // Process action include
        if (grammarSpec.actionInclude) {
            if (typeof grammarSpec.actionInclude === 'function') {
                this.actionInclude = String(grammarSpec.actionInclude)
                    .replace(/^\s*function \(\) \{/, '')
                    .replace(/\}\s*$/, '');
            } else {
                this.actionInclude = grammarSpec.actionInclude;
            }
        } else {
            this.actionInclude = '';
        }
        
        this.moduleInclude = grammarSpec.moduleInclude || '';
        
        // Process BNF/EBNF formats
        if (!this.bnf && this.ebnf) {
            this.bnf = ebnfParser.transform(this.ebnf);
        }
    }

    /**
     * Process operators to set precedence and associativity
     * @param {Array} ops - Operator definitions
     * @returns {Object} - Processed operators with precedence and associativity
     * @private
     */
    _processOperators(ops) {
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
    }

    /**
     * Process tokens into a standardized format
     * @param {Array|String} tokens - Token definitions
     * @returns {Array} - Processed tokens
     * @private
     */
    _processTokens(tokens) {
        if (!tokens) return [];
        
        if (typeof tokens === 'string') {
            return tokens.trim().split(' ');
        } else if (Array.isArray(tokens)) {
            return tokens.slice(0);
        }
        
        return [];
    }

    /**
     * Check if grammar is valid and has at least one rule
     * @returns {Boolean} - True if valid
     */
    isValid() {
        return this.bnf && Object.keys(this.bnf).length > 0;
    }
}

module.exports = Grammar;