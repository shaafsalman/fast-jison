/**
 * lib/parsers/ll1.js
 * 
 * LL(1) parser implementation
 * 
 * Refactorings applied:
 * - Extract Class: Created specialized LL(1) implementation
 * - Replace Conditional with Polymorphism: Using polymorphism for parser types
 */

"use strict";

const ParserBase = require('./parser-base');
const LookaheadCalculator = require('../algorithms/lookahead');
const Nonterminal = require('../core/nonterminal');
const Production = require('../core/production');
const { Set } = require('../util/set');

/**
 * LL(1) Parser Generator
 */
class LL1Generator extends ParserBase {
    /**
     * Create a new LL(1) parser generator
     * @param {Object} grammar - Grammar object
     * @param {Object} options - Parser options
     */
    constructor(grammar, options) {
        super(grammar, options);
        
        this.type = "LL(1)";
        
        // Process the grammar
        this.processGrammar();
        
        // Compute lookaheads
        this.lookahead = new LookaheadCalculator(this, options);
        this.lookahead.computeLookaheads();
        
        // Build the table
        this.buildTable();
    }
    
    /**
     * Process the grammar
     */
    processGrammar() {
        // Initialize collections
        this.nonterminals = {};
        this.symbols_ = {};
        this.symbols = [];
        this.productions = [];
        this.terminals = [];
        
        // Process grammar elements
        const productionBuilder = new ProductionBuilder(this);
        productionBuilder.buildAll();
        
        // Augment the grammar
        this.augmentGrammar();
    }
    
    /**
     * Augment the grammar with accept state
     */
    augmentGrammar() {
        if (this.productions.length === 0) {
            throw new Error("Grammar error: must have at least one rule.");
        }
        
        // Use specified start symbol, or default to first user defined production
        this.startSymbol = this.grammar.start || this.grammar.startSymbol || this.productions[0].symbol;
        
        if (!this.nonterminals[this.startSymbol]) {
            throw new Error("Grammar error: startSymbol must be a non-terminal found in your grammar.");
        }
        
        this.EOF = "$end";
        
        // Prepend parser tokens
        this.symbols.unshift("$accept", this.EOF);
        this.symbols_.$accept = 0;
        this.symbols_[this.EOF] = 1;
        this.terminals.unshift(this.EOF);
        
        // Add follow $ to start symbol
        this.nonterminals[this.startSymbol].follows.push(this.EOF);
    }
    
    /**
     * Build the parsing table for LL(1)
     */
    buildTable() {
        this.table = this.parseTable(this.productions);
    }
    
    /**
     * Generate the LL(1) parsing table
     * @param {Array} productions - Grammar productions
     * @returns {Object} - Parsing table
     */
    parseTable(productions) {
        const table = {};
        
        productions.forEach((production, i) => {
            const row = table[production.symbol] || {};
            const tokens = production.first;
            
            // If production handle is nullable, add follows tokens
            if (this.lookahead.nullable(production.handle)) {
                Set.union(tokens, this.nonterminals[production.symbol].follows);
            }
            
            tokens.forEach(token => {
                if (row[token]) {
                    row[token].push(i);
                    this.conflicts++;
                } else {
                    row[token] = [i];
                }
            });
            
            table[production.symbol] = row;
        });
        
        return table;
    }
    
    /**
     * Generate parser code
     * @param {Object} options - Generation options
     * @returns {String} - Generated code
     */
    generate(options) {
        const CodeGenerator = require('../core/code-generator');
        return CodeGenerator.generate(this, options);
    }
    
    /**
     * Create a parser instance
     * @returns {Object} - Parser instance
     */
    createParser() {
        const CodeGenerator = require('../core/code-generator');
        return CodeGenerator.createParser(this);
    }
}

/**
 * Builds productions from grammar BNF
 */
class ProductionBuilder {
    /**
     * Create a new ProductionBuilder
     * @param {Object} generator - Parser generator
     */
    constructor(generator) {
        this.generator = generator;
        this.grammar = generator.grammar;
        this.nonterminals = generator.nonterminals;
        this.bnf = this.grammar.bnf;
        this.symbols_ = generator.symbols_ = {};
        this.symbols = generator.symbols;
        this.productions = generator.productions;
        this.operators = generator.grammar.operators;
        
        this.symbolId = 1;
        this.actions = [
            '/* this == yyval */',
            this.grammar.actionInclude || '',
            'var $0 = $$.length - 1;',
            'switch (yystate) {'
        ];
        this.actionGroups = {};
        this.productions_ = generator.productions_ = [0];
        this.hasErrorRecovery = false;
    }
    
    /**
     * Build all productions from the grammar
     */
    buildAll() {
        // Add error symbol
        this.addSymbol("error");
        
        // Process each symbol in the grammar
        for (const symbol in this.bnf) {
            if (!this.bnf.hasOwnProperty(symbol)) continue;
            
            this.addSymbol(symbol);
            this.nonterminals[symbol] = new Nonterminal(symbol);
            
            // Get productions for this symbol
            const prods = typeof this.bnf[symbol] === 'string' 
                ? this.bnf[symbol].split(/\s*\|\s*/g)
                : this.bnf[symbol].slice(0);
            
            // Process each production
            prods.forEach(handle => this.buildProduction(symbol, handle));
        }
        
        // Complete the actions
        for (const action in this.actionGroups) {
            this.actions.push(this.actionGroups[action].join(' '), action, 'break;');
        }
        
        // Process terminals
        this.buildTerminals();
        
        // Create the performAction function
        this.buildPerformAction();
    }
    
    /**
     * Add a symbol to the symbol table
     * @param {String} s - Symbol to add
     */
    addSymbol(s) {
        if (s && this.symbols_[s] === undefined) {
            this.symbols_[s] = this.symbolId++;
            this.symbols.push(s);
        }
    }
    
    /**
     * Build terminals from symbols
     */
    buildTerminals() {
        const terms = [];
        const terms_ = {};
        
        // Find all terminals (symbols that are not nonterminals)
        for (const sym in this.symbols_) {
            if (this.symbols_.hasOwnProperty(sym) && !this.nonterminals[sym]) {
                terms.push(sym);
                terms_[this.symbols_[sym]] = sym;
            }
        }
        
        this.generator.hasErrorRecovery = this.hasErrorRecovery;
        this.generator.terminals = terms;
        this.generator.terminals_ = terms_;
    }
    
    /**
     * Build the performAction function
     */
    buildPerformAction() {
        this.actions.push('}');
        
        const actions = this.actions.join("\n")
            .replace(/YYABORT/g, 'return false')
            .replace(/YYACCEPT/g, 'return true');
        
        let parameters = "yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */";
        
        if (this.grammar.parseParams) {
            parameters += ', ' + this.grammar.parseParams.join(', ');
        }
        
        this.generator.performAction = `function anonymous(${parameters}) {\n${actions}\n}`;
    }
    
    /**
     * Build a production rule
     * @param {String} symbol - Nonterminal symbol
     * @param {String|Array} handle - Production handle
     */
    buildProduction(symbol, handle) {
        if (Array.isArray(handle)) {
            // Handle structured production
            this.buildStructuredProduction(symbol, handle);
        } else {
            // Handle simple production
            this.buildSimpleProduction(symbol, handle);
        }
    }
    
    /**
     * Build a structured production with semantic actions
     * @param {String} symbol - Nonterminal symbol
     * @param {Array} handle - Structured production handle
     */
    buildStructuredProduction(symbol, handle) {
        // Get the RHS of the production
        const rhs = (typeof handle[0] === 'string') 
            ? handle[0].trim().split(' ') 
            : handle[0].slice(0);
        
        // Process symbols in the RHS
        for (let i = 0; i < rhs.length; i++) {
            if (rhs[i] === 'error') this.hasErrorRecovery = true;
            this.addSymbol(rhs[i]);
        }
        
        let r;
        
        // Handle semantic action or precedence
        if (typeof handle[1] === 'string' || handle.length === 3) {
            // Semantic action specified
            const label = 'case ' + (this.productions.length + 1) + ':';
            let action = handle[1];
            
            // Process named semantic values
            action = this.processSemanticValues(action, rhs);
            
            // Add to action groups
            if (action in this.actionGroups) {
                this.actionGroups[action].push(label);
            } else {
                this.actionGroups[action] = [label];
            }
            
            // Create production
            r = new Production(symbol, this.stripAliases(rhs), this.productions.length + 1);
            
            // Handle precedence
            if (handle[2] && this.operators[handle[2].prec]) {
                r.precedence = this.operators[handle[2].prec].precedence;
            }
        } else {
            // Only precedence specified
            r = new Production(symbol, this.stripAliases(rhs), this.productions.length + 1);
            
            if (handle[1] && handle[1].prec && this.operators[handle[1].prec]) {
                r.precedence = this.operators[handle[1].prec].precedence;
            }
        }
        
        this.setProductionPrecedence(r);
        this.finalizeProduction(r, symbol);
    }
    
    /**
     * Build a simple production without semantic actions
     * @param {String} symbol - Nonterminal symbol
     * @param {String} handle - Simple production handle
     */
    buildSimpleProduction(symbol, handle) {
        // Strip aliases
        handle = handle.replace(/\[[a-zA-Z_][a-zA-Z0-9_-]*\]/g, '');
        const rhs = handle.trim().split(' ');
        
        // Process symbols in the RHS
        for (let i = 0; i < rhs.length; i++) {
            if (rhs[i] === 'error') this.hasErrorRecovery = true;
            this.addSymbol(rhs[i]);
        }
        
        // Create production
        const r = new Production(symbol, rhs, this.productions.length + 1);
        this.setProductionPrecedence(r);
        this.finalizeProduction(r, symbol);
    }
    
    /**
     * Strip aliases from RHS symbols
     * @param {Array} rhs - RHS symbols
     * @returns {Array} - RHS with aliases stripped
     */
    stripAliases(rhs) {
        return rhs.map(e => e.replace(/\[[a-zA-Z_][a-zA-Z0-9_-]*\]/g, ''));
    }
    
    /**
     * Process semantic values in action code
     * @param {String} action - Semantic action code
     * @param {Array} rhs - RHS symbols
     * @returns {String} - Processed action code
     */
    processSemanticValues(action, rhs) {
        if (action.match(/[$@][a-zA-Z][a-zA-Z0-9_]*/)) {
            const count = {};
            const names = {};
            
            for (let i = 0; i < rhs.length; i++) {
                // Check for aliased names
                let rhs_i = rhs[i].match(/\[[a-zA-Z][a-zA-Z0-9_-]*\]/);
                
                if (rhs_i) {
                    rhs_i = rhs_i[0].substr(1, rhs_i[0].length - 2);
                    rhs[i] = rhs[i].substr(0, rhs[i].indexOf('['));
                } else {
                    rhs_i = rhs[i];
                }
                
                if (names[rhs_i]) {
                    names[rhs_i + (++count[rhs_i])] = i + 1;
                } else {
                    names[rhs_i] = i + 1;
                    names[rhs_i + "1"] = i + 1;
                    count[rhs_i] = 1;
                }
            }
            
            action = action.replace(/\$([a-zA-Z][a-zA-Z0-9_]*)/g, (str, pl) => {
                return names[pl] ? '$' + names[pl] : str;
            }).replace(/@([a-zA-Z][a-zA-Z0-9_]*)/g, (str, pl) => {
                return names[pl] ? '@' + names[pl] : str;
            });
        }
        
        return action
            // Replace references to $$ with this.$, and @$ with this._$
            .replace(/([^'"])\$\$|^\$\$/g, '$1this.$').replace(/@[0$]/g, "this._$")
            
            // Replace semantic value references ($n) with stack value (stack[n])
            .replace(/\$(-?\d+)/g, (_, n) => {
                return "$$[$0" + (parseInt(n, 10) - rhs.length || '') + "]";
            })
            // Same for location references (@n)
            .replace(/@(-?\d+)/g, (_, n) => {
                return "_$[$0" + (n - rhs.length || '') + "]";
            });
    }
    
    /**
     * Set precedence for a production
     * @param {Object} r - Production
     */
    setProductionPrecedence(r) {
        if (r.precedence === 0) {
            // Set precedence based on rightmost terminal
            for (let i = r.handle.length - 1; i >= 0; i--) {
                if (!(r.handle[i] in this.nonterminals) && r.handle[i] in this.operators) {
                    r.precedence = this.operators[r.handle[i]].precedence;
                    break;
                }
            }
        }
    }
    
    /**
     * Finalize a production
     * @param {Object} r - Production
     * @param {String} symbol - Nonterminal symbol
     */
    finalizeProduction(r, symbol) {
        this.productions.push(r);
        this.productions_.push([this.symbols_[r.symbol], r.handle[0] === '' ? 0 : r.handle.length]);
        this.nonterminals[symbol].productions.push(r);
    }
}

module.exports = LL1Generator;