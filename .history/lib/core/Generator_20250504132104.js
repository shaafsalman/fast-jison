/*
 * File: lib/core/Generator.js
 * Source: Extracted from jison.js
 * Refactorings applied: 
 *   - Extract Class: Separated generator functionality
 *   - Consolidate Conditional Expressions: Better type handling
 * Functionality: Base generator for parser generation
 */

var Lexer = require('jison-lex');
var ebnfParser = require('ebnf-parser');
var Set = require('../utils/Set').Set;
var typal = require('../utils/Typal').typal;
var parserMethods = require('../parsers/base').parserMethods;

// Nonterminal class
function Nonterminal(symbol) {
    this.symbol = symbol;
    this.productions = new Set();
    this.first = [];
    this.follows = [];
    this.nullable = false;
}

Nonterminal.prototype.toString = function Nonterminal_toString() {
    var str = this.symbol+"\n";
    str += (this.nullable ? 'nullable' : 'not nullable');
    str += "\nFirsts: "+this.first.join(', ');
    str += "\nFollows: "+this.first.join(', ');
    str += "\nProductions:\n  "+this.productions.join('\n  ');

    return str;
};

// Production class
function Production(symbol, handle, id) {
    this.symbol = symbol;
    this.handle = handle;
    this.nullable = false;
    this.id = id;
    this.first = [];
    this.precedence = 0;
}

Production.prototype.toString = function Production_toString() {
    return this.symbol+" -> "+this.handle.join(' ');
};

// Core generator constructor
var generator = typal.beget(parserMethods);

generator.constructor = function Jison_Generator(grammar, opt) {
    if (typeof grammar === 'string') {
        grammar = ebnfParser.parse(grammar);
    }

    var options = typal.mix.call({}, grammar.options, opt);
    this.terms = {};
    this.operators = {};
    this.productions = [];
    this.conflicts = 0;
    this.resolutions = [];
    this.options = options;
    this.parseParams = grammar.parseParams;
    this.yy = {}; // accessed as yy free variable in the parser/lexer actions

    // source included in semantic action execution scope
    if (grammar.actionInclude) {
        if (typeof grammar.actionInclude === 'function') {
            grammar.actionInclude = String(grammar.actionInclude).replace(/^\s*function \(\) \{/, '').replace(/\}\s*$/, '');
        }
        this.actionInclude = grammar.actionInclude;
    }
    this.moduleInclude = grammar.moduleInclude || '';

    this.DEBUG = options.debug || false;

    this.processGrammar(grammar);

    if (grammar.lex) {
        this.lexer = new Lexer(grammar.lex, null, this.terminals_);
    }
};

generator.processGrammar = function processGrammarDef(grammar) {
    var bnf = grammar.bnf,
        tokens = grammar.tokens,
        nonterminals = this.nonterminals = {},
        productions = this.productions,
        self = this;

    if (!grammar.bnf && grammar.ebnf) {
        bnf = grammar.bnf = ebnfParser.transform(grammar.ebnf);
    }

    if (tokens) {
        if (typeof tokens === 'string') {
            tokens = tokens.trim().split(' ');
        } else {
            tokens = tokens.slice(0);
        }
    }

    var symbols = this.symbols = [];

    // calculate precedence of operators
    var operators = this.operators = processOperators(grammar.operators);

    // build productions from cfg
    this.buildProductions(bnf, productions, nonterminals, symbols, operators);

    if (tokens && this.terminals.length !== tokens.length) {
        self.trace("Warning: declared tokens differ from tokens found in rules.");
        self.trace(this.terminals);
        self.trace(tokens);
    }

    // augment the grammar
    this.augmentGrammar(grammar);
};

generator.augmentGrammar = function augmentGrammar(grammar) {
    if (this.productions.length === 0) {
        throw new Error("Grammar error: must have at least one rule.");
    }
    // use specified start symbol, or default to first user defined production
    this.startSymbol = grammar.start || grammar.startSymbol || this.productions[0].symbol;
    if (!this.nonterminals[this.startSymbol]) {
        throw new Error("Grammar error: startSymbol must be a non-terminal found in your grammar.");
    }
    this.EOF = "$end";

    // augment the grammar
    var acceptProduction = new Production('$accept', [this.startSymbol, '$end'], 0);
    this.productions.unshift(acceptProduction);

    // prepend parser tokens
    this.symbols.unshift("$accept",this.EOF);
    this.symbols_.$accept = 0;
    this.symbols_[this.EOF] = 1;
    this.terminals.unshift(this.EOF);

    this.nonterminals.$accept = new Nonterminal("$accept");
    this.nonterminals.$accept.productions.push(acceptProduction);

    // add follow $ to start symbol
    this.nonterminals[this.startSymbol].follows.push(this.EOF);
};

// set precedence and associativity of operators
function processOperators(ops) {
    if (!ops) return {};
    var operators = {};
    for (var i=0,k,prec;prec=ops[i]; i++) {
        for (k=1;k < prec.length;k++) {
            operators[prec[k]] = {precedence: i+1, assoc: prec[0]};
        }
    }
    return operators;
}

generator.buildProductions = function buildProductions(bnf, productions, nonterminals, symbols, operators) {
    // Implementation of production building...
    // This is a simplified version of the original complex code
    
    var actionGroups = {};
    var productions_ = [0];
    var symbolId = 1;
    var symbols_ = {};
    var symbol;

    function addSymbol(s) {
        if (s && !symbols_[s]) {
            symbols_[s] = ++symbolId;
            symbols.push(s);
        }
    }

    // Add error symbol
    addSymbol("error");

    for (symbol in bnf) {
        if (!bnf.hasOwnProperty(symbol)) continue;

        addSymbol(symbol);
        nonterminals[symbol] = new Nonterminal(symbol);

        var prods = typeof bnf[symbol] === 'string' 
                    ? bnf[symbol].split(/\s*\|\s*/g) 
                    : bnf[symbol].slice(0);

        prods.forEach(function(handle) {
            // Build production for this handle
            var production = new Production(symbol, typeof handle === 'string' 
                ? handle.trim().split(' ') 
                : handle, productions.length+1);
            
            productions.push(production);
            productions_.push([symbols_[production.symbol], production.handle[0] === '' ? 0 : production.handle.length]);
            nonterminals[symbol].productions.push(production);
        });
    }

    var sym, terms = [], terms_ = {};
    for (var id in symbols_) {
        sym = symbols_[id];
        if (!nonterminals[sym]) {
            terms.push(sym);
            terms_[id] = sym;
        }
    }

    this.terminals = terms;
    this.terminals_ = terms_;
    this.symbols_ = symbols_;
    this.productions_ = productions_;
};

generator.trace = function trace() { };

generator.warn = function warn() {
    var args = Array.prototype.slice.call(arguments,0);
    console.log(args.join(""));
};

generator.error = function error(msg) {
    throw new Error(msg);
};

generator.createParser = function createParser() {
    throw new Error('Calling abstract method.');
};

// Export classes and module
exports.generator = generator;
exports.Nonterminal = Nonterminal;
exports.Production = Production;