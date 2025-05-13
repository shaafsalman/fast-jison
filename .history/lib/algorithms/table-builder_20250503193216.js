/**
 * lib/algorithms/table-builder.js
 * 
 * Builds parser tables for LR parsers
 * 
 * Refactorings applied:
 * - Extract Class: Created specialized TableBuilder class
 * - Decompose Conditional: Simplified complex conditional logic
 */

"use strict";

/**
 * Action types for parser tables
 */
const ACTION = {
    SHIFT: 1,
    REDUCE: 2,
    ACCEPT: 3
};

/**
 * Non-associative operator code
 */
const NONASSOC = 0;

/**
 * Builds parser tables for LR parsers
 */
class TableBuilder {
    /**
     * Create a new TableBuilder
     * @param {Object} generator - Parser generator
     */
    constructor(generator) {
        this.generator = generator;
        this.nonterminals = generator.nonterminals;
        this.terminals = generator.terminals;
        this.symbols_ = generator.symbolTable;
        this.operators = generator.operators;
        this.productions = generator.productions;
        this.states = generator.states;
        this.DEBUG = generator.options.debug;
        this.conflicts = 0;
        this.resolutions = [];
        this.EOF = generator.EOF;
    }
    
    /**
     * Build the parsing table
     * @returns {Array} - Parsing table
     */
    build() {
        const states = [];
        const conflictedStates = {};
        
        // For each item set
        this.states.forEach((itemSet, k) => {
            const state = states[k] = {};
            
            // Set shift and goto actions
            this.setShiftAndGotoActions(state, itemSet, k);
            
            // Set accept action
            this.setAcceptAction(state, itemSet, k);
            
            // Set reductions and resolve conflicts
            this.setReductionsAndResolveConflicts(state, itemSet, k, conflictedStates);
        });
        
        // Report conflicts if in debug mode
        if (this.conflicts > 0 && !this.DEBUG) {
            console.warn(`\n${this.conflicts} Conflict(s) found in grammar.`);
            console.warn("\nStates with conflicts:");
            for (const state in conflictedStates) {
                console.warn(`State ${state}`);
                console.warn(`  ${this.states.item(state).join("\n  ")}`);
            }
        }
        
        return states;
    }
    
    /**
     * Set shift and goto actions for a state
     * @param {Object} state - State to set actions for
     * @param {Object} itemSet - Item set for the state
     */
    setShiftAndGotoActions(state, itemSet) {
        for (const stackSymbol in itemSet.edges) {
            itemSet.forEach(item => {
                // Find shift and goto actions
                if (item.markedSymbol === stackSymbol) {
                    const gotoState = itemSet.edges[stackSymbol];
                    
                    if (this.nonterminals[stackSymbol]) {
                        // Store state to go to after a reduce (goto)
                        state[this.symbols_[stackSymbol]] = gotoState;
                    } else {
                        // Store shift action
                        state[this.symbols_[stackSymbol]] = [ACTION.SHIFT, gotoState];
                    }
                }
            });
        }
    }
    
    /**
     * Set accept action for a state
     * @param {Object} state - State to set action for
     * @param {Object} itemSet - Item set for the state
     */
    setAcceptAction(state, itemSet) {
        itemSet.forEach(item => {
            if (item.markedSymbol === this.EOF) {
                // Accept
                state[this.symbols_[this.EOF]] = [ACTION.ACCEPT];
            }
        });
    }
    
    /**
     * Set reductions and resolve conflicts
     * @param {Object} state - State to set actions for
     * @param {Object} itemSet - Item set for the state
     * @param {Number} stateNum - State number
     * @param {Object} conflictedStates - Map of conflicted states
     */
    setReductionsAndResolveConflicts(state, itemSet, stateNum, conflictedStates) {
        const allterms = this.generator.lookAheads ? false : this.terminals;
        
        // For each reduction
        itemSet.reductions.forEach(item => {
            // If parser uses lookahead, only enumerate those terminals
            const terminals = allterms || this.generator.lookAheads(itemSet, item);
            
            terminals.forEach(stackSymbol => {
                let action = state[this.symbols_[stackSymbol]];
                const op = this.operators[stackSymbol];
                
                // Reading a terminal and current position is at the end of a production, try to reduce
                if (action || (action && action.length)) {
                    const reduceAction = [ACTION.REDUCE, item.production.id];
                    const solution = this.resolveConflict(
                        item.production, 
                        op, 
                        reduceAction, 
                        action[0] instanceof Array ? action[0] : action
                    );
                    
                    this.resolutions.push([stateNum, stackSymbol, solution]);
                    
                    if (solution.bydefault) {
                        this.conflicts++;
                        
                        if (!this.DEBUG) {
                            console.warn(`Conflict in grammar: multiple actions possible when lookahead token is ${stackSymbol} in state ${stateNum}`);
                            console.warn(`- ${this.printAction(solution.r)}`);
                            console.warn(`- ${this.printAction(solution.s)}`);
                            conflictedStates[stateNum] = true;
                        }
                        
                        if (this.generator.options.noDefaultResolve) {
                            if (!(action[0] instanceof Array)) {
                                action = [action];
                            }
                            action.push(solution.r);
                        }
                    } else {
                        action = solution.action;
                    }
                } else {
                    action = [ACTION.REDUCE, item.production.id];
                }
                
                if (action && action.length) {
                    state[this.symbols_[stackSymbol]] = action;
                } else if (action === NONASSOC) {
                    state[this.symbols_[stackSymbol]] = undefined;
                }
            });
        });
    }
    
    /**
     * Resolve a shift-reduce or reduce-reduce conflict
     * @param {Object} production - Production involved in the conflict
     * @param {Object} op - Operator for the lookahead token
     * @param {Array} reduce - Reduce action
     * @param {Array} shift - Shift action
     * @returns {Object} - Resolution
     */
    resolveConflict(production, op, reduce, shift) {
        const solution = {
            production: production,
            operator: op,
            r: reduce,
            s: shift
        };
        
        // Reduce-reduce conflict
        if (shift[0] === ACTION.REDUCE) {
            return this.resolveReduceReduceConflict(solution);
        }
        
        // Shift-reduce conflict
        return this.resolveShiftReduceConflict(solution);
    }
    
    /**
     * Resolve a reduce-reduce conflict
     * @param {Object} solution - Conflict solution
     * @returns {Object} - Updated solution
     */
    resolveReduceReduceConflict(solution) {
        solution.msg = "Resolve R/R conflict (use first production declared in grammar.)";
        solution.action = solution.s[1] < solution.r[1] ? solution.s : solution.r;
        
        if (solution.s[1] !== solution.r[1]) {
            solution.bydefault = true;
        }
        
        return solution;
    }
    
    /**
     * Resolve a shift-reduce conflict
     * @param {Object} solution - Conflict solution
     * @returns {Object} - Updated solution
     */
    resolveShiftReduceConflict(solution) {
        const production = solution.production;
        const op = solution.operator;
        
        // No precedence specified
        if (production.precedence === 0 || !op) {
            solution.msg = "Resolve S/R conflict (shift by default.)";
            solution.bydefault = true;
            solution.action = solution.s;
        }
        // Production precedence < operator precedence
        else if (production.precedence < op.precedence) {
            solution.msg = "Resolve S/R conflict (shift for higher precedent operator.)";
            solution.action = solution.s;
        }
        // Equal precedence
        else if (production.precedence === op.precedence) {
            if (op.assoc === "right") {
                solution.msg = "Resolve S/R conflict (shift for right associative operator.)";
                solution.action = solution.s;
            } else if (op.assoc === "left") {
                solution.msg = "Resolve S/R conflict (reduce for left associative operator.)";
                solution.action = solution.r;
            } else if (op.assoc === "nonassoc") {
                solution.msg = "Resolve S/R conflict (no action for non-associative operator.)";
                solution.action = NONASSOC;
            }
        }
        // Production precedence > operator precedence
        else {
            solution.msg = "Resolve conflict (reduce for higher precedent production.)";
            solution.action = solution.r;
        }
        
        return solution;
    }
    
    /**
     * Find states with only one action, a reduction
     * @param {Array} states - Parsing states
     * @returns {Object} - Default actions
     */
    findDefaults(states) {
        const defaults = {};
        
        states.forEach((state, k) => {
            let i = 0;
            let act;
            
            for (act in state) {
                if (state.hasOwnProperty(act)) {
                    i++;
                }
            }
            
            if (i === 1 && state[act][0] === ACTION.REDUCE) {
                // Only one action in state and it's a reduction
                defaults[k] = state[act];
            }
        });
        
        return defaults;
    }
    
    /**
     * Format an action for display
     * @param {Array} action - Parser action
     * @returns {String} - Formatted action
     */
    printAction(action) {
        const actionTypes = {
            [ACTION.SHIFT]: 'shift',
            [ACTION.REDUCE]: 'reduce',
            [ACTION.ACCEPT]: 'accept'
        };
        
        if (action[0] === ACTION.SHIFT) { // shift
            return `${actionTypes[action[0]]} token (then go to state ${action[1]})`;
        } else if (action[0] === ACTION.REDUCE) { // reduce
            return `${actionTypes[action[0]]} by rule: ${this.productions[action[1]]}`;
        } else { // accept
            return actionTypes[action[0]];
        }
    }
}

module.exports = TableBuilder;