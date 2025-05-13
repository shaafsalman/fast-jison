/**
 * lib/core/grammar.js
 * 
 * Represents a grammar specification
 * 
 * Refactorings applied:
 * - Extract Class: Created Grammar class from jison.js generator logic
 * - Move Method: Moved processOperators from generator
 * - Replace Array with Object: Added proper property structure
 */

"use strict";

const ebnfParser = require('ebnf-parser');
const { GrammarError } = require('../util/error-handler');

/**
 * Represents a grammar specification with BNF rules, tokens, and operators
 */
class Grammar {
    /**
     * Create a new Grammar
     * @param {Object|String} grammarSpec - Grammar specification object or string
     */
    constructor(grammarSpec) {
        // Convert string grammars to object format
        if (typeof grammarSpec === 'string') {
            grammarSpec = ebnfParser.parse(grammarSpec);
        }

        // Core grammar elements
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
     * @returns {Object} - Processed operators
     * @private
     */
    _processOperators(ops) {
        if (!ops) return {};
        
        const operators = {};
        for (let i = 0, k, prec; prec = ops[i]; i++) {
            for (k = 1; k < prec.length; k++) {
                operators[prec[k]] = {
                    precedence: i + 1,
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
     * Check if grammar is valid
     * @returns {Boolean} - True if valid
     */
    validate() {
        if (!this.bnf || Object.keys(this.bnf).length === 0) {
            throw new GrammarError("Grammar error: must have at least one rule.");
        }
        
        if (this.start && !this.bnf[this.start]) {
            throw new GrammarError("Grammar error: startSymbol must be a non-terminal found in your grammar.");
        }
        
        return true;
    }
}

module.exports = Grammar;