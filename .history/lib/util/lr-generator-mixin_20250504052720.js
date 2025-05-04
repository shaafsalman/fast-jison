/*
 * File: lib/util/lr-generator-mixin.js
 * Source: Extracted from jison.js
 * Refactorings applied: 
 * - Extract Class (lrGeneratorMixin)
 * - Move Method (LR generator methods)
 * - Extract Method (parseTable, canonicalCollection)
 * 
 * Functionality: Provides LR parser generator functionality
 */

var Item = require("../core/item").Item;
var ItemSet = require("../core/item-set").ItemSet;
var Set = require("./set").Set;

var lrGeneratorMixin = {
    buildTable: function buildTable() {
        if (this.DEBUG) this.mix(require('./debug-mixins').lrGeneratorDebug);

        this.states = this.canonicalCollection();
        this.table = this.parseTable(this.states);
        this.defaultActions = findDefaults(this.table);
    },

    closureOperation: function closureOperation(itemSet) {
        var closureSet = new this.ItemSet();
        var self = this;

        var set = itemSet,
            itemQueue, syms = {};

        do {
            itemQueue = new Set();
            closureSet.concat(set);
            set.forEach(function CO_set_forEach(item) {
                var symbol = item.markedSymbol;

                // If token is a non-terminal, recursively add closures
                if (symbol && self.nonterminals[symbol]) {
                    if (!syms[symbol]) {
                        self.nonterminals[symbol].productions.forEach(function CO_nt_forEach(production) {
                            var newItem = new self.Item(production, 0);
                            if (!closureSet.contains(newItem))
                                itemQueue.push(newItem);
                        });
                        syms[symbol] = true;
                    }
                } else if (!symbol) {
                    // Reduction
                    closureSet.reductions.push(item);
                    closureSet.inadequate = closureSet.reductions.length > 1 || closureSet.shifts;
                } else {
                    // Shift
                    closureSet.shifts = true;
                    closureSet.inadequate = closureSet.reductions.length > 0;
                }
            });

            set = itemQueue;

        } while (!itemQueue.isEmpty());

        return closureSet;
    },

    gotoOperation: function gotoOperation(itemSet, symbol) {
        var gotoSet = new this.ItemSet(),
            self = this;

        itemSet.forEach(function goto_forEach(item, n) {
            if (item.markedSymbol === symbol) {
                gotoSet.push(new self.Item(item.production, item.dotPosition + 1, item.follows, n));
            }
        });

        return gotoSet.isEmpty() ? gotoSet : this.closureOperation(gotoSet);
    },

    /* Create unique set of item sets */
    canonicalCollection: function canonicalCollection() {
        var item1 = new this.Item(this.productions[0], 0, [this.EOF]);
        var firstState = this.closureOperation(new this.ItemSet(item1)),
            states = new Set(firstState),
            marked = 0,
            self = this,
            itemSet;

        states.has = {};
        states.has[firstState] = 0;

        while (marked !== states.size()) {
            itemSet = states.item(marked);
            marked++;
            itemSet.forEach(function CC_itemSet_forEach(item) {
                if (item.markedSymbol && item.markedSymbol !== self.EOF)
                    self.canonicalCollectionInsert(item.markedSymbol, itemSet, states, marked - 1);
            });
        }

        return states;
    },

    // Pushes a unique state into the queue. Some parsing algorithms may perform additional operations
    canonicalCollectionInsert: function canonicalCollectionInsert(symbol, itemSet, states, stateNum) {
        var g = this.gotoOperation(itemSet, symbol);
        if (!g.predecessors)
            g.predecessors = {};
        // Add g to queue if not empty or duplicate
        if (!g.isEmpty()) {
            var gv = g.valueOf(),
                i = states.has[gv];
            if (i === -1 || typeof i === 'undefined') {
                states.has[gv] = states.size();
                itemSet.edges[symbol] = states.size(); // Store goto transition for table
                states.push(g);
                g.predecessors[symbol] = [stateNum];
            } else {
                itemSet.edges[symbol] = i; // Store goto transition for table
                states.item(i).predecessors[symbol].push(stateNum);
            }
        }
    },

    parseTable: function parseTable(itemSets) {
        var states = [],
            nonterminals = this.nonterminals,
            operators = this.operators,
            conflictedStates = {}, // Array of [state, token] tuples
            self = this,
            s = 1, // Shift
            r = 2, // Reduce
            a = 3; // Accept

        // For each item set
        itemSets.forEach(function(itemSet, k) {
            var state = states[k] = {};
            var action, stackSymbol;

            // Set shift and goto actions
            for (stackSymbol in itemSet.edges) {
                itemSet.forEach(function(item, j) {
                    // Find shift and goto actions
                    if (item.markedSymbol == stackSymbol) {
                        var gotoState = itemSet.edges[stackSymbol];
                        if (nonterminals[stackSymbol]) {
                            // Store state to go to after a reduce
                            state[self.symbols_[stackSymbol]] = gotoState;
                        } else {
                            state[self.symbols_[stackSymbol]] = [s, gotoState];
                        }
                    }
                });
            }

            // Set accept action
            itemSet.forEach(function(item, j) {
                if (item.markedSymbol == self.EOF) {
                    // Accept
                    state[self.symbols_[self.EOF]] = [a];
                }
            });

            var allterms = self.lookAheads ? false : self.terminals;

            // Set reductions and resolve potential conflicts
            itemSet.reductions.forEach(function(item, j) {
                // If parser uses lookahead, only enumerate those terminals
                var terminals = allterms || self.lookAheads(itemSet, item);

                terminals.forEach(function(stackSymbol) {
                    action = state[self.symbols_[stackSymbol]];
                    var op = operators[stackSymbol];

                    // Reading a terminal and current position is at the end of a production, try to reduce
                    if (action || action && action.length) {
                        var sol = resolveConflict(item.production, op, [r, item.production.id], action[0] instanceof Array ? action[0] : action);
                        self.resolutions.push([k, stackSymbol, sol]);
                        if (sol.bydefault) {
                            self.conflicts++;
                            if (!self.DEBUG) {
                                self.warn('Conflict in grammar: multiple actions possible when lookahead token is ', stackSymbol, ' in state ', k, "\n- ", printAction(sol.r, self), "\n- ", printAction(sol.s, self));
                                conflictedStates[k] = true;
                            }
                            if (self.options.noDefaultResolve) {
                                if (!(action[0] instanceof Array))
                                    action = [action];
                                action.push(sol.r);
                            }
                        } else {
                            action = sol.action;
                        }
                    } else {
                        action = [r, item.production.id];
                    }
                    if (action && action.length) {
                        state[self.symbols_[stackSymbol]] = action;
                    } else if (action === NONASSOC) {
                        state[self.symbols_[stackSymbol]] = undefined;
                    }
                });
            });
        });

        if (!self.DEBUG && self.conflicts > 0) {
            self.warn("\nStates with conflicts:");
            for (var state in conflictedStates) {
                self.warn('State ' + state);
                self.warn('  ', itemSets.item(state).join("\n  "));
            }
        }

        return states;
    },

    // Generate the module string
    generateModule_: function generateModule_() {
        var parseFn = String(parser.parse);
        if (!this.hasErrorRecovery) {
            parseFn = removeErrorRecovery(parseFn);
        }

        if (this.options['token-stack']) {
            parseFn = addTokenStack(parseFn);
        }

        // Generate code with fresh variable names
        nextVariableId = 0;
        var tableCode = this.generateTableCode(this.table);

        // Generate the initialization code
        var commonCode = tableCode.commonCode;

        // Generate the module creation code
        var moduleCode = "{";
        moduleCode += [
            "trace: " + String(this.trace || parser.trace),
            "yy: {}",
            "symbols_: " + JSON.stringify(this.symbols_),
            "terminals_: " + JSON.stringify(this.terminals_).replace(/"([0-9]+)":/g,"$1:"),
            "productions_: " + JSON.stringify(this.productions_),
            "performAction: " + String(this.performAction),
            "table: " + tableCode.moduleCode,
            "defaultActions: " + JSON.stringify(this.defaultActions).replace(/"([0-9]+)":/g,"$1:"),
            "parseError: " + String(this.parseError || (this.hasErrorRecovery ? traceParseError : parser.parseError)),
            "parse: " + parseFn
        ].join(",\n");
        moduleCode += "};";

        return { commonCode: commonCode, moduleCode: moduleCode };
    },

    // Generate code that represents the specified parser table
    generateTableCode: function(table) {
        var moduleCode = JSON.stringify(table);
        var variables = [createObjectCode];

        // Don't surround numerical property name numbers in quotes
        moduleCode = moduleCode.replace(/"([0-9]+)"(?=:)/g, "$1");

        // Replace objects with several identical values by function calls
        moduleCode = moduleCode.replace(/\{\d+:[^\}]+,\d+:[^\}