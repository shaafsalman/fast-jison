/**
 * lib/parsers/lalr.js
 * 
 * LALR(1) parser implementation
 * 
 * Refactorings applied:
 * - Extract Class: Created specialized parser implementation
 * - Replace Inheritance with Delegation: Using composition for algorithms
 */

"use strict";

const ParserBase = require('./parser-base');
const Nonterminal = require('../core/nonterminal');
const Production = require('../core/production');
const LookaheadCalculator = require('../algorithms/lookahead');
const TableBuilder = require('../algorithms/table-builder');
const { Set } = require('../util/set');

/**
 * LALR(1) Parser Generator
 */
class LALRGenerator extends ParserBase {
    /**
     * Create a new LALR parser generator
     * @param {Object} grammar - Grammar object
     * @param {Object} options - Parser options
     */
    constructor(grammar, options) {
        super(grammar, options);
        
        this.type = "LALR(1)";
        this.terms_ = {};
        
        // Process the grammar
        this.processGrammar();
        
        // Build canonical collection
        this.states = this.canonicalCollection();
        
        // Initialize new grammar for computing lookaheads
        this.buildNewGrammar();
        
        // Compute lookaheads
        this.lookahead = new LookaheadCalculator(this, options);
        this.lookahead.computeLookaheads();
        
        // Union lookaheads
        this.unionLookaheads();
        
        // Build the parsing table
        this.buildTable();
    }
    
    /**
     * Process the grammar and prepare for parsing
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
        
        // Augment the grammar with accept production
        const acceptProduction = new Production('$accept', [this.startSymbol, '$end'], 0);
        this.productions.unshift(acceptProduction);
        
        // Prepend parser tokens
        this.symbols.unshift("$accept", this.EOF);
        this.symbols_.$accept = 0;
        this.symbols_[this.EOF] = 1;
        this.terminals.unshift(this.EOF);
        
        this.nonterminals.$accept = new Nonterminal("$accept");
        this.nonterminals.$accept.productions.push(acceptProduction);
        
        // Add follow $ to start symbol
        this.nonterminals[this.startSymbol].follows.push(this.EOF);
    }
    
    /**
     * Build parsing table
     */
    buildTable() {
        const tableBuilder = new TableBuilder(this);
        this.table = tableBuilder.build();
        this.defaultActions = tableBuilder.findDefaults(this.table);
    }
    
    /**
     * Build new grammar for lookahead computation
     */
    buildNewGrammar() {
        this.trace("Building lookahead grammar.");
        
        // Initialize new grammar
        this.inadequateStates = [];
        
        // If true, only lookaheads in inadequate states are computed (faster, larger table)
        // If false, lookaheads for all reductions will be computed (slower, smaller table)
        this.onDemandLookahead = this.options.onDemandLookahead || false;
        
        // Create new grammar for lookahead computation
        this.newg = {
            nonterminals: {},
            productions: [],
            terminals: this.terminals,
            symbols: this.symbols,
            nterms_: {},
            oldg: this
        };
        
        // Process each state
        this.states.forEach((state, i) => {
            state.forEach(item => {
                if (item.dotPosition === 0) {
                    // New symbols are a combination of state and transition symbol
                    const symbol = i + ":" + item.production.symbol;
                    this.terms_[symbol] = item.production.symbol;
                    this.newg.nterms_[symbol] = i;
                    
                    if (!this.newg.nonterminals[symbol]) {
                        this.newg.nonterminals[symbol] = new Nonterminal(symbol);
                    }
                    
                    const pathInfo = this.goPath(i, item.production.handle);
                    const p = new Production(symbol, pathInfo.path, this.newg.productions.length);
                    this.newg.productions.push(p);
                    this.newg.nonterminals[symbol].productions.push(p);
                    
                    // Store the transition that gets 'backed up to' after reduction on path
                    const handle = item.production.handle.join(' ');
                    const goes = this.states.item(pathInfo.endState).goes;
                    
                    if (!goes[handle]) {
                        goes[handle] = [];
                    }
                    
                    goes[handle].push(symbol);
                }
            });
            
            if (state.inadequate) {
                this.inadequateStates.push(i);
            }
        });
    }
    
    /**
     * Union lookaheads for better performance
     */
    unionLookaheads() {
        this.trace("Computing lookaheads.");
        
        const newg = this.newg;
        const states = this.onDemandLookahead ? this.inadequateStates : this.states;
        
        states.forEach(i => {
            const state = typeof i === 'number' ? this.states.item(i) : i;
            
            if (state.reductions.length) {
                state.reductions.forEach(item => {
                    const follows = {};
                    
                    // Add all current follows
                    for (let k = 0; k < item.follows.length; k++) {
                        follows[item.follows[k]] = true;
                    }
                    
                    // Add follows from the new grammar
                    state.goes[item.production.handle.join(' ')].forEach(symbol => {
                        newg.nonterminals[symbol].follows.forEach(symbol => {
                            const terminal = this.terms_[symbol];
                            if (!follows[terminal]) {
                                follows[terminal] = true;
                                item.follows.push(terminal);
                            }
                        });
                    });
                });
            }
        });
    }
    
    /**
     * Create unique set of item sets
     * @returns {Object} Collection of states
     */
    canonicalCollection() {
        const Item = this.Item;
        const ItemSet = this.ItemSet;
        
        const item1 = new Item(this.productions[0], 0, [this.EOF]);
        const firstState = this.closureOperation(new ItemSet(item1));
        const states = new Set(firstState);
        let marked = 0;
        
        states.has = {};
        states.has[firstState] = 0;
        
        while (marked !== states.size()) {
            const itemSet = states.item(marked);
            marked++;
            
            itemSet.forEach(item => {
                if (item.markedSymbol && item.markedSymbol !== this.EOF) {
                    this.canonicalCollectionInsert(item.markedSymbol, itemSet, states, marked - 1);
                }
            });
        }
        
        return states;
    }
    
    /**
     * Insert a state into the canonical collection
     * @param {String} symbol - Symbol for the goto operation
     * @param {Object} itemSet - Current item set
     * @param {Object} states - All states
     * @param {Number} stateNum - Current state number
     */
    canonicalCollectionInsert(symbol, itemSet, states, stateNum) {
        const g = this.gotoOperation(itemSet, symbol);
        if (!g.predecessors) {
            g.predecessors = {};
        }
        
        // Add g to queue if not empty or duplicate
        if (!g.isEmpty()) {
            const gv = g.valueOf();
            const i = states.has[gv];
            
            if (i === -1 || typeof i === 'undefined') {
                states.has[gv] = states.size();
                itemSet.edges[symbol] = states.size(); // Store goto transition for table
                states.push(g);
                g.predecessors[symbol] = [stateNum];
            } else {
                itemSet.edges[symbol] = i; // Store goto transition for table
                states.it