/*
 * File: lib/parsers/LRParser.js
 * Source: Extracted from jison.js LR parser functionality
 * Refactorings applied: 
 *   - Extract Class: Separated LR parser functionality
 *   - Form Template Method: Standardized methods for parser generation
 * Functionality: LR parser functionality
 */

var parser = require('../core/Parser').parser;
var typal = require('../utils/Typal').typal;
var Set = require('../utils/Set').Set;
var parserMethods = require('./base').parserMethods;
var generator = require('../core/Generator').generator;
var Nonterminal = require('../core/Generator').Nonterminal;
var Production = require('../core/Generator').Production;

// Mixin for common behaviors of lookahead parsers
var lookaheadMixin = {
    computeLookaheads: function computeLookaheads() {
        this.computeLookaheads = function() {};
        this.nullableSets();
        this.firstSets();
        this.followSets();
    },

    // calculate follow sets based on first and nullable
    followSets: function followSets() {
        var productions = this.productions,
            nonterminals = this.nonterminals,
            self = this,
            cont = true;

        // loop until no further changes have been made
        while(cont) {
            cont = false;

            productions.forEach(function(production) {
                var q;
                var ctx = !!self.go_;

                var set = [], oldcount;
                for (var i=0, t; t=production.handle[i]; ++i) {
                    if (!nonterminals[t]) continue;

                    if (ctx)
                        q = self.go_(production.symbol, production.handle.slice(0, i));
                    var bool = !ctx || q === parseInt(self.nterms_[t], 10);

                    if (i === production.handle.length+1 && bool) {
                        set = nonterminals[production.symbol].follows;
                    } else {
                        var part = production.handle.slice(i+1);

                        set = self.first(part);
                        if (self.nullable(part) && bool) {
                            set.push.apply(set, nonterminals[production.symbol].follows);
                        }
                    }
                    oldcount = nonterminals[t].follows.length;
                    Set.union(nonterminals[t].follows, set);
                    if (oldcount !== nonterminals[t].follows.length) {
                        cont = true;
                    }
                }
            });
        }
    },

    // return the FIRST set of a symbol or series of symbols
    first: function first(symbol) {
        // epsilon
        if (symbol === '') {
            return [];
        // RHS
        } else if (symbol instanceof Array) {
            var firsts = [];
            for (var i=0, t; t=symbol[i]; ++i) {
                if (!this.nonterminals[t]) {
                    if (firsts.indexOf(t) === -1)
                        firsts.push(t);
                } else {
                    Set.union(firsts, this.nonterminals[t].first);
                }
                if (!this.nullable(t))
                    break;
            }
            return firsts;
        // terminal
        } else if (!this.nonterminals[symbol]) {
            return [symbol];
        // nonterminal
        } else {
            return this.nonterminals[symbol].first;
        }
    },

    // fixed-point calculation of FIRST sets
    firstSets: function firstSets() {
        var productions = this.productions,
            nonterminals = this.nonterminals,
            self = this,
            cont = true,
            symbol, firsts;

        // loop until no further changes have been made
        while(cont) {
            cont = false;

            productions.forEach(function(production) {
                var firsts = self.first(production.handle);
                if (firsts.length !== production.first.length) {
                    production.first = firsts;
                    cont=true;
                }
            });

            for (symbol in nonterminals) {
                firsts = [];
                nonterminals[symbol].productions.forEach(function(production) {
                    Set.union(firsts, production.first);
                });
                if (firsts.length !== nonterminals[symbol].first.length) {
                    nonterminals[symbol].first = firsts;
                    cont=true;
                }
            }
        }
    },

    // fixed-point calculation of NULLABLE
    nullableSets: function nullableSets() {
        var nonterminals = this.nonterminals,
            self = this,
            cont = true;

        // loop until no further changes have been made
        while(cont) {
            cont = false;

            // check if each production is nullable
            this.productions.forEach(function(production) {
                if (!production.nullable) {
                    for (var i=0, n=0, t; t=production.handle[i]; ++i) {
                        if (self.nullable(t)) n++;
                    }
                    if (n === i) { // production is nullable if all tokens are nullable
                        production.nullable = cont = true;
                    }
                }
            });

            //check if each symbol is nullable
            for (var symbol in nonterminals) {
                if (!this.nullable(symbol)) {
                    for (var i=0, production; production=nonterminals[symbol].productions.item(i); i++) {
                        if (production.nullable)
                            nonterminals[symbol].nullable = cont = true;
                    }
                }
            }
        }
    },

    // check if a token or series of tokens is nullable
    nullable: function nullable(symbol) {
        // epsilon
        if (symbol === '') {
            return true;
        // RHS
        } else if (symbol instanceof Array) {
            for (var i=0, t; t=symbol[i]; ++i) {
                if (!this.nullable(t))
                    return false;
            }
            return true;
        // terminal
        } else if (!this.nonterminals[symbol]) {
            return false;
        // nonterminal
        } else {
            return this.nonterminals[symbol].nullable;
        }
    }
};

// Mixin for common LR parser behavior
var lrGeneratorMixin = {
    buildTable: function buildTable() {
        this.states = this.canonicalCollection();
        this.table = this.parseTable(this.states);
        this.defaultActions = findDefaults(this.table);
    },

    Item: typal.construct({
        constructor: function Item(production, dot, f, predecessor) {
            this.production = production;
            this.dotPosition = dot || 0;
            this.follows = f || [];
            this.predecessor = predecessor;
            this.id = parseInt(production.id+'a'+this.dotPosition, 36);
            this.markedSymbol = this.production.handle[this.dotPosition];
        },
        remainingHandle: function() {
            return this.production.handle.slice(this.dotPosition+1);
        },
        eq: function(e) {
            return e.id === this.id;
        },
        handleToString: function() {
            var handle = this.production.handle.slice(0);
            handle[this.dotPosition] = '.'+(handle[this.dotPosition]||'');
            return handle.join(' ');
        },
        toString: function() {
            var temp = this.production.handle.slice(0);
            temp[this.dotPosition] = '.'+(temp[this.dotPosition]||'');
            return this.production.symbol+" -> "+temp.join(' ') +
                (this.follows.length === 0 ? "" : " #lookaheads= "+this.follows.join(' '));
        }
    }),

    ItemSet: Set.prototype.construct({
        afterconstructor: function() {
            this.reductions = [];
            this.goes = {};
            this.edges = {};
            this.shifts = false;
            this.inadequate = false;
            this.hash_ = {};
            for (var i=this._items.length-1; i>=0; i--) {
                this.hash_[this._items[i].id] = true;
            }
        },
        concat: function concat(set) {
            var a = set._items || set;
            for (var i=a.length-1; i>=0; i--) {
                this.hash_[a[i].id] = true;
            }
            this._items.push.apply(this._items, a);
            return this;
        },
        push: function(item) {
            this.hash_[item.id] = true;
            return this._items.push(item);
        },
        contains: function(item) {
            return this.hash_[item.id];
        },
        valueOf: function toValue() {
            var v = this._items.map(function(a) {return a.id;}).sort().join('|');
            this.valueOf = function toValue_inner() {return v;};
            return v;
        }
    }),

    closureOperation: function closureOperation(itemSet) {
        var closureSet = new this.ItemSet();
        var self = this;

        var set = itemSet,
            itemQueue, syms = {};

        do {
            itemQueue = new Set();
            closureSet.concat(set);
            set.forEach(function(item) {
                var symbol = item.markedSymbol;

                // if token is a non-terminal, recursively add closures
                if (symbol && self.nonterminals[symbol]) {
                    if(!syms[symbol]) {
                        self.nonterminals[symbol].productions.forEach(function(production) {
                            var newItem = new self.Item(production, 0);
                            if(!closureSet.contains(newItem))
                                itemQueue.push(newItem);
                        });
                        syms[symbol] = true;
                    }
                } else if (!symbol) {
                    // reduction
                    closureSet.reductions.push(item);
                    closureSet.inadequate = closureSet.reductions.length > 1 || closureSet.shifts;
                } else {
                    // shift
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

        itemSet.forEach(function(item) {
            if (item.markedSymbol === symbol) {
                gotoSet.push(new self.Item(item.production, item.dotPosition+1, item.follows, item));
            }
        });

        return gotoSet.isEmpty() ? gotoSet : this.closureOperation(gotoSet);
    },

    // Create unique set of item sets
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
            itemSet = states.item(marked); marked++;
            itemSet.forEach(function(item) {
                if (item.markedSymbol && item.markedSymbol !== self.EOF)
                    self.canonicalCollectionInsert(item.markedSymbol, itemSet, states, marked-1);
            });
        }

        return states;
    },

    // Pushes a unique state into the que. Some parsing algorithms may perform additional operations
    canonicalCollectionInsert: function canonicalCollectionInsert(symbol, itemSet, states, stateNum) {
        var g = this.gotoOperation(itemSet, symbol);
        if (!g.predecessors)
            g.predecessors = {};
            
        // add g to que if not empty or duplicate
        if (!g.isEmpty()) {
            var gv = g.valueOf(),
                i = states.has[gv];
            if (i === -1 || typeof i === 'undefined') {
                states.has[gv] = states.size();
                itemSet.edges[symbol] = states.size(); // store goto transition for table
                states.push(g);
                g.predecessors[symbol] = [stateNum];
            } else {
                itemSet.edges[symbol] = i; // store goto transition for table
                states.item(i).predecessors[symbol].push(stateNum);
            }
        }
    },

    parseTable: function parseTable(itemSets) {
        var NONASSOC = 0;
        var states = [],
            nonterminals = this.nonterminals,
            operators = this.operators,
            self = this,
            s = 1, // shift
            r = 2, // reduce
            a = 3; // accept

        // for each item set
        itemSets.forEach(function(itemSet, k) {
            var state = states[k] = {};
            var action, stackSymbol;

            // set shift and goto actions
            for (stackSymbol in itemSet.edges) {
                itemSet.forEach(function(item) {
                    // find shift and goto actions
                    if (item.markedSymbol == stackSymbol) {
                        var gotoState = itemSet.edges[stackSymbol];
                        if (nonterminals[stackSymbol]) {
                            state[self.symbols_[stackSymbol]] = gotoState;
                        } else {
                            state[self.symbols_[stackSymbol]] = [s, gotoState];
                        }
                    }
                });
            }

            // set accept action
            itemSet.forEach(function(item) {
                if (item.markedSymbol == self.EOF) {
                    // accept
                    state[self.symbols_[self.EOF]] = [a];
                }
            });

            var allterms = self.lookAheads ? false : self.terminals;

            // set reductions and resolve potential conflicts
            itemSet.reductions.forEach(function(item) {
                // if parser uses lookahead, only enumerate those terminals
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
                                self.warn('Conflict in grammar: multiple actions possible when lookahead token is ', stackSymbol, ' in state ', k);
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

        return states;
    }
};

// find states with only one action, a reduction
function findDefaults(states) {
    var defaults = {};
    states.forEach(function(state, k) {
        var i = 0;
        for (var act in state) {
            if ({}.hasOwnProperty.call(state, act)) i++;
        }

        if (i === 1 && state[act][0] === 2) {
            // only one action in state and it's a reduction
            defaults[k] = state[act];
        }
    });

    return defaults;
}

// resolves shift-reduce and reduce-reduce conflicts
function resolveConflict(production, op, reduce, shift) {
    var NONASSOC = 0;
    var sln = {production: production, operator: op, r: reduce, s: shift},
        s = 1, // shift
        r = 2, // reduce
        a = 3; // accept

    if (shift[0] === r) {
        sln.msg = "Resolve R/R conflict (use first production declared in grammar.)";
        sln.action = shift[1] < reduce[1] ? shift : reduce;
        if (shift[1] !== reduce[1]) sln.bydefault = true;
        return sln;
    }

    if (production.precedence === 0 || !op) {
        sln.msg = "Resolve S/R conflict (shift by default.)";
        sln.bydefault = true;
        sln.action = shift;
    } else if (production.precedence < op.precedence) {
        sln.msg = "Resolve S/R conflict (shift for higher precedent operator.)";
        sln.action = shift;
    } else if (production.precedence === op.precedence) {
        if (op.assoc === "right") {
            sln.msg = "Resolve S/R conflict (shift for right associative operator.)";
            sln.action = shift;
        } else if (op.assoc === "left") {
            sln.msg = "Resolve S/R conflict (reduce for left associative operator.)";
            sln.action = reduce;
        } else if (op.assoc === "nonassoc") {
            sln.msg = "Resolve S/R conflict (no action for non-associative operator.)";
            sln.action = NONASSOC;
        }
    } else {
        sln.msg = "Resolve conflict (reduce for higher precedent production.)";
        sln.action = reduce;
    }

    return sln;
}

// Create the LR parser generator with all the needed mixins
var lr0 = generator.beget(lookaheadMixin, lrGeneratorMixin, parserMethods);
var LR0Generator = lr0.construct();

exports.lrGeneratorMixin = lrGeneratorMixin;
exports.lookaheadMixin = lookaheadMixin;
exports.LR0Generator = LR0Generator;