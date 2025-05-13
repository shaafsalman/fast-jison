/*
 * File: lib/generator/generator.js
 * 
 * Refactorings applied:
 * - Extract Class: Created dedicated Generator class
 * - Extract Method: Separated grammar processing from construction
 * - Pull-up Method: Moved common methods to base class
 * 
 * Functionality: Base Generator class for parser generation
 */

var typal = require('../util/typal').typal;
var helpers = require('../common/helpers');
var ebnfParser = require('ebnf-parser');
var Lexer = require('jison-lex');
var Set = require('../util/set').Set;

var Nonterminal = typal.construct({
    constructor: function Nonterminal(symbol) {
        this.symbol = symbol;
        this.productions = new Set();
        this.first = [];
        this.follows = [];
        this.nullable = false;
    },
    toString: function Nonterminal_toString() {
        var str = this.symbol + "\n";
        str += (this.nullable ? 'nullable' : 'not nullable');
        str += "\nFirsts: " + this.first.join(', ');
        str += "\nFollows: " + this.first.join(', ');
        str += "\nProductions:\n  " + this.productions.join('\n  ');

        return str;
    }
});

var Production = typal.construct({
    constructor: function Production(symbol, handle, id) {
        this.symbol = symbol;
        this.handle = handle;
        this.nullable = false;
        this.id = id;
        this.first = [];
        this.precedence = 0;
    },
    toString: function Production_toString() {
        return this.symbol + " -> " + this.handle.join(' ');
    }
});

// Debug mixin for generators
var generatorDebug = {
    trace: function trace() {
        console.log.apply(console, arguments);
    },
    beforeprocessGrammar: function() {
        this.trace("Processing grammar.");
    },
    afteraugmentGrammar: function() {
        var trace = this.trace;
        helpers.each(this.symbols, function(sym, i) {
            trace(sym + "(" + i + ")");
        });
    }
};

// Base generator object
var generator = typal.beget();

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
    this.yy = {}; // Accessed as yy free variable in parser/lexer actions

    // Source included in semantic action execution scope
    if (grammar.actionInclude) {
        if (typeof grammar.actionInclude === 'function') {
            grammar.actionInclude = String(grammar.actionInclude)
                .replace(/^\s*function \(\) \{/, '')
                .replace(/\}\s*$/, '');
        }
        this.actionInclude = grammar.actionInclude;
    }
    
    this.moduleInclude = grammar.moduleInclude || '';

    this.DEBUG = options.debug || false;
    if (this.DEBUG) this.mix(generatorDebug); // Mixin debug methods

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

    // Calculate precedence of operators
    var operators = this.operators = helpers.processOperators(grammar.operators);

    // Build productions from cfg
    this.buildProductions(bnf, productions, nonterminals, symbols, operators);

    if (tokens && this.terminals.length !== tokens.length) {
        self.trace("Warning: declared tokens differ from tokens found in rules.");
        self.trace(this.terminals);
        self.trace(tokens);
    }

    // Augment the grammar
    this.augmentGrammar(grammar);
};

generator.augmentGrammar = function augmentGrammar(grammar) {
    if (this.productions.length === 0) {
        throw new Error("Grammar error: must have at least one rule.");
    }
    
    // Use specified start symbol, or default to first user defined production
    this.startSymbol = grammar.start || grammar.startSymbol || this.productions[0].symbol;
    
    if (!this.nonterminals[this.startSymbol]) {
        throw new Error("Grammar error: startSymbol must be a non-terminal found in your grammar.");
    }
    
    this.EOF = "$end";

    // Augment the grammar
    var acceptProduction = new Production('$accept', [this.startSymbol, '$end'], 0);
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
};

generator.buildProductions = function buildProductions(bnf, productions, nonterminals, symbols, operators) {
    var actions = [
        '/* this == yyval */',
        this.actionInclude || '',
        'var $0 = $$.length - 1;',
        'switch (yystate) {'
    ];
    
    var actionGroups = {};
    var prods, symbol;
    var productions_ = [0];
    var symbolId = 1;
    var symbols_ = {};

    var hasErrorRecovery = false;

    function addSymbol(s) {
        if (s && !symbols_[s]) {
            symbols_[s] = ++symbolId;
            symbols.push(s);
        }
    }

    // Add error symbol; will be third symbol, or "2" ($accept, $end, error)
    addSymbol("error");

    for (symbol in bnf) {
        if (!bnf.hasOwnProperty(symbol)) continue;

        addSymbol(symbol);
        nonterminals[symbol] = new Nonterminal(symbol);

        if (typeof bnf[symbol] === 'string') {
            prods = bnf[symbol].split(/\s*\|\s*/g);
        } else {
            prods = bnf[symbol].slice(0);
        }

        prods.forEach(buildProduction);
    }
    
    for (var action in actionGroups) {
        actions.push(actionGroups[action].join(' '), action, 'break;');
    }

    var sym, terms = [], terms_ = {};
    helpers.each(symbols_, function(id, sym) {
        if (!nonterminals[sym]) {
            terms.push(sym);
            terms_[id] = sym;
        }
    });

    this.hasErrorRecovery = hasErrorRecovery;

    this.terminals = terms;
    this.terminals_ = terms_;
    this.symbols_ = symbols_;

    this.productions_ = productions_;
    actions.push('}');

    actions = actions.join("\n")
        .replace(/YYABORT/g, 'return false')
        .replace(/YYACCEPT/g, 'return true');

    var parameters = "yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */";
    if (this.parseParams) parameters += ', ' + this.parseParams.join(', ');

    this.performAction = "function anonymous(" + parameters + ") {\n" + actions + "\n}";

    function buildProduction(handle) {
        var r, rhs, i;
        if (handle.constructor === Array) {
            rhs = (typeof handle[0] === 'string') ?
                handle[0].trim().split(' ') :
                handle[0].slice(0);

            for (i=0; i<rhs.length; i++) {
                if (rhs[i] === 'error') hasErrorRecovery = true;
                if (!symbols_[rhs[i]]) {
                    addSymbol(rhs[i]);
                }
            }

            if (typeof handle[1] === 'string' || handle.length == 3) {
                // Semantic action specified
                var label = 'case ' + (productions.length+1) + ':', action = handle[1];

                // Replace named semantic values ($nonterminal)
                if (action.match(/[$@][a-zA-Z][a-zA-Z0-9_]*/)) {
                    var count = {},
                        names = {};
                    for (i=0; i<rhs.length; i++) {
                        // Check for aliased names, e.g., id[alias]
                        var rhs_i = rhs[i].match(/\[[a-zA-Z][a-zA-Z0-9_-]*\]/);
                        if (rhs_i) {
                            rhs_i = rhs_i[0].substr(1, rhs_i[0].length-2);
                            rhs[i] = rhs[i].substr(0, rhs[i].indexOf('['));
                        } else {
                            rhs_i = rhs[i];
                        }

                        if (names[rhs_i]) {
                            names[rhs_i + (++count[rhs_i])] = i+1;
                        } else {
                            names[rhs_i] = i+1;
                            names[rhs_i + "1"] = i+1;
                            count[rhs_i] = 1;
                        }
                    }
                    
                    action = action.replace(/\$([a-zA-Z][a-zA-Z0-9_]*)/g, function(str, pl) {
                        return names[pl] ? '$'+names[pl] : str;
                    }).replace(/@([a-zA-Z][a-zA-Z0-9_]*)/g, function(str, pl) {
                        return names[pl] ? '@'+names[pl] : str;
                    });
                }
                
                action = action
                    // Replace references to $$ with this.$, and @$ with this._$
                    .replace(/([^'"])\$\$|^\$\$/g, '$1this.$').replace(/@[0$]/g, "this._$")

                    // Replace semantic value references ($n) with stack value (stack[n])
                    .replace(/\$(-?\d+)/g, function(_, n) {
                        return "$$[$0" + (parseInt(n, 10) - rhs.length || '') + "]";
                    })
                    // Same as above for location references (@n)
                    .replace(/@(-?\d+)/g, function(_, n) {
                        return "_$[$0" + (n - rhs.length || '') + "]";
                    });
                
                if (action in actionGroups) actionGroups[action].push(label);
                else actionGroups[action] = [label];

                // Done with aliases; strip them.
                rhs = rhs.map(function(e) { return e.replace(/\[[a-zA-Z_][a-zA-Z0-9_-]*\]/g, ''); });
                r = new Production(symbol, rhs, productions.length+1);
                
                // Precedence specified also
                if (handle[2] && operators[handle[2].prec]) {
                    r.precedence = operators[handle[2].prec].precedence;
                }
            } else {
                // No action -> don't care about aliases; strip them.
                rhs = rhs.map(function(e) { return e.replace(/\[[a-zA-Z_][a-zA-Z0-9_-]*\]/g, ''); });
                // Only precedence specified
                r = new Production(symbol, rhs, productions.length+1);
                if (operators[handle[1].prec]) {
                    r.precedence = operators[handle[1].prec].precedence;
                }
            }
        } else {
            // No action -> don't care about aliases; strip them.
            handle = handle.replace(/\[[a-zA-Z_][a-zA-Z0-9_-]*\]/g, '');
            rhs = handle.trim().split(' ');
            for (i=0; i<rhs.length; i++) {
                if (rhs[i] === 'error') hasErrorRecovery = true;
                if (!symbols_[rhs[i]]) {
                    addSymbol(rhs[i]);
                }
            }
            r = new Production(symbol, rhs, productions.length+1);
        }
        
        if (r.precedence === 0) {
            // Set precedence
            for (i=r.handle.length-1; i>=0; i--) {
                if (!(r.handle[i] in nonterminals) && r.handle[i] in operators) {
                    r.precedence = operators[r.handle[i]].precedence;
                }
            }
        }

        productions.push(r);
        productions_.push([symbols_[r.symbol], r.handle[0] === '' ? 0 : r.handle.length]);
        nonterminals[symbol].productions.push(r);
    }
};

generator.createParser = function createParser() {
    throw new Error('Calling abstract method.');
};

// Noop. Implemented in debug mixin
generator.trace = function trace() { };

generator.warn = function warn() {
    var args = Array.prototype.slice.call(arguments, 0);
    console.log(args.join(""));
};

generator.error = function error(msg) {
    throw new Error(msg);
};

// Generate methods for module creation
generator.generateModule = function generateModule(opt) {
    opt = typal.mix.call({}, this.options, opt);
    var moduleName = opt.moduleName || "parser";
    
    var out = "/* parser generated by jison */\n"
        + "/*\n"
        + "  Returns a Parser object of the following structure:\n"
        + "\n"
        + "  Parser: {\n"
        + "    yy: {}\n"
        + "  }\n"
        + "\n"
        + "  Parser.prototype: {\n"
        + "    yy: {},\n"
        + "    trace: function(),\n"
        + "    symbols_: {associative list: name ==> number},\n"
        + "    terminals_: {associative list: number ==> name},\n"
        + "    productions_: [...],\n"
        + "    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),\n"
        + "    table: [...],\n"
        + "    defaultActions: {...},\n"
        + "    parseError: function(str, hash),\n"
        + "    parse: function(input),\n"
        + "\n"
        + "    lexer: {\n"
        + "        EOF: 1,\n"
        + "        parseError: function(str, hash),\n"
        + "        setInput: function(input),\n"
        + "        input: function(),\n"
        + "        unput: function(str),\n"
        + "        more: function(),\n"
        + "        less: function(n),\n"
        + "        pastInput: function(),\n"
        + "        upcomingInput: function(),\n"
        + "        showPosition: function(),\n"
        + "        test_match: function(regex_match_array, rule_index),\n"
        + "        next: function(),\n"
        + "        lex: function(),\n"
        + "        begin: function(condition),\n"
        + "        popState: function(),\n"
        + "        _currentRules: function(),\n"
        + "        topState: function(),\n"
        + "        pushState: function(condition),\n"
        + "\n"
        + "        options: {\n"
        + "            ranges: boolean           (optional: true ==> token location info will include a .range[] member)\n"
        + "            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)\n"
        + "            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)\n"
        + "        },\n"
        + "\n"
        + "        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),\n"
        + "        rules: [...],\n"
        + "        conditions: {associative list: name ==> set},\n"
        + "    }\n"
        + "  }\n"
        + "\n"
        + "\n"
        + "  token location info (@$, _$, etc.): {\n"
        + "    first_line: n,\n"
        + "    last_line: n,\n"
        + "    first_column: n,\n"
        + "    last_column: n,\n"
        + "    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)\n"
        + "  }\n"
        + "\n"
        + "\n"
        + "  the parseError function receives a 'hash' object with these members for lexer and parser errors: {\n"
        + "    text:        (matched text)\n"
        + "    token:       (the produced terminal token, if any)\n"
        + "    line:        (yylineno)\n"
        + "  }\n"
        + "  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {\n"
        + "    loc:         (yylloc)\n"
        + "    expected:    (string describing the set of expected tokens)\n"
        + "    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)\n"
        + "  }\n"
        + "*/\n";
    
    out += (moduleName.match(/\./) ? moduleName : "var "+moduleName) +
            " = " + this.generateModuleExpr();

    return out;
};

generator.generateAMDModule = function generateAMDModule(opt) {
    opt = typal.mix.call({}, this.options, opt);
    var module = this.generateModule_();
    
    var out = '\n\ndefine(function(require){\n'
        + module.commonCode
        + '\nvar parser = ' + module.moduleCode
        + "\n" + this.moduleInclude
        + (this.lexer && this.lexer.generateModule ?
          '\n' + this.lexer.generateModule() +
          '\nparser.lexer = lexer;' : '')
        + '\nreturn parser;'
        + '\n});'
    
    return out;
};

generator.generateCommonJSModule = function generateCommonJSModule(opt) {
    opt = typal.mix.call({}, this.options, opt);
    var moduleName = opt.moduleName || "parser";
    
    var out = this.generateModule(opt)
        + "\n\n\nif (typeof require !== 'undefined' && typeof exports !== 'undefined') {"
        + "\nexports.parser = " + moduleName + ";"
        + "\nexports.Parser = " + moduleName + ".Parser;"
        + "\nexports.parse = function () { return " + moduleName + ".parse.apply(" + moduleName + ", arguments); };"
        + "\nexports.main = " + String(opt.moduleMain || helpers.commonjsMain) + ";"
        + "\nif (typeof module !== 'undefined' && require.main === module) {\n"
        + "  exports.main(process.argv.slice(1));\n}"
        + "\n}";

    return out;
};

generator.generate = function parser_generate(opt) {
    opt = typal.mix.call({}, this.options, opt);
    var code = "";

    // Check for illegal identifier
    if (!opt.moduleName || !opt.moduleName.match(/^[A-Za-z_$][A-Za-z0-9_$]*$/)) {
        opt.moduleName = "parser";
    }
    
    switch (opt.moduleType) {
        case "js":
            code = this.generateModule(opt);
            break;
        case "amd":
            code = this.generateAMDModule(opt);
            break;
        default:
            code = this.generateCommonJSModule(opt);
            break;
    }

    return code;
};

// Export the generator constructor
exports.Generator = generator.construct();