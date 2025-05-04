/*
 * File: lib/parser/parser.js
 * 
 * Refactorings applied:
 * - Extract Class: Created dedicated Parser class
 * - Replace Conditional with Polymorphism: Moved parser-specific logic to appropriate classes
 * - Extract Method: Separated parsing logic into methods
 * 
 * Functionality: Base Parser class with core parsing functionality
 */

var typal = require('../util/typal').typal;
var constants = require('../common/constants');

// Base parser object
var parser = typal.beget();

// Default error handling methods
parser.trace = function() {
    console.log.apply(console, arguments);
};

parser.warn = function() {
    var args = Array.prototype.slice.call(arguments, 0);
    console.log(args.join(""));
};

parser.error = function(msg) {
    throw new Error(msg);
};

// Default parse error handler - can be overridden
parser.parseError = function(str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        var error = new Error(str);
        error.hash = hash;
        throw error;
    }
};

// Main parsing function
parser.parse = function parse(input) {
    var self = this,
        stack = [0],
        tstack = [], // token stack
        vstack = [null], // semantic value stack
        lstack = [], // location stack
        table = this.table,
        yytext = '',
        yylineno = 0,
        yyleng = 0,
        recovering = 0,
        TERROR = 2,
        EOF = 1;

    var args = lstack.slice.call(arguments, 1);

    var lexer = Object.create(this.lexer);
    var sharedState = { yy: {} };
    
    // Copy state
    for (var k in this.yy) {
        if (Object.prototype.hasOwnProperty.call(this.yy, k)) {
            sharedState.yy[k] = this.yy[k];
        }
    }

    lexer.setInput(input, sharedState.yy);
    sharedState.yy.lexer = lexer;
    sharedState.yy.parser = this;
    
    if (typeof lexer.yylloc == 'undefined') {
        lexer.yylloc = {};
    }
    
    var yyloc = lexer.yylloc;
    lstack.push(yyloc);

    var ranges = lexer.options && lexer.options.ranges;

    if (typeof sharedState.yy.parseError === 'function') {
        this.parseError = sharedState.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }

    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }

    // Token processing function
    var lex = function() {
        var token;
        token = lexer.lex() || EOF;
        // If token isn't its numeric value, convert
        if (typeof token !== 'number') {
            token = self.symbols_[token] || token;
        }
        return token;
    };

    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    
    while (true) {
        // Retrieve state number from top of stack
        state = stack[stack.length - 1];

        // Use default actions if available
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            // Read action for current state and first input
            action = table[state] && table[state][symbol];
        }

        // Handle parse error
        if (typeof action === 'undefined' || !action.length || !action[0]) {
            var error_rule_depth;
            var errStr = '';

            // Return the rule stack depth where the nearest error rule can be found
            function locateNearestErrorRecoveryRule(state) {
                var stack_probe = stack.length - 1;
                var depth = 0;

                // Try to recover from error
                for(;;) {
                    // Check for error recovery rule in this state
                    if ((TERROR.toString()) in table[state]) {
                        return depth;
                    }
                    if (state === 0 || stack_probe < 2) {
                        return false; // No suitable error recovery rule available
                    }
                    stack_probe -= 2; // popStack(1): [symbol, action]
                    state = stack[stack_probe];
                    ++depth;
                }
            }

            if (!recovering) {
                // First see if there's any chance at hitting an error recovery rule
                error_rule_depth = locateNearestErrorRecoveryRule(state);

                // Report error
                expected = [];
                for (p in table[state]) {
                    if (this.terminals_[p] && p > TERROR) {
                        expected.push("'" + this.terminals_[p] + "'");
                    }
                }
                
                if (lexer.showPosition) {
                    errStr = 'Parse error on line ' + (yylineno+1) + ":\n" + lexer.showPosition() + "\nExpecting " + expected.join(', ') + ", got '" + (this.terminals_[symbol] || symbol) + "'";
                } else {
                    errStr = 'Parse error on line ' + (yylineno+1) + ": Unexpected " +
                        (symbol == EOF ? "end of input" : ("'" + (this.terminals_[symbol] || symbol) + "'"));
                }
                
                this.parseError(errStr, {
                    text: lexer.match,
                    token: this.terminals_[symbol] || symbol,
                    line: lexer.yylineno,
                    loc: yyloc,
                    expected: expected,
                    recoverable: (error_rule_depth !== false)
                });
            } else if (preErrorSymbol !== EOF) {
                error_rule_depth = locateNearestErrorRecoveryRule(state);
            }

            // Just recovered from another error
            if (recovering == 3) {
                if (symbol === EOF || preErrorSymbol === EOF) {
                    throw new Error(errStr || 'Parsing halted while starting to recover from another error.');
                }

                // Discard current lookahead and grab another
                yyleng = lexer.yyleng;
                yytext = lexer.yytext;
                yylineno = lexer.yylineno;
                yyloc = lexer.yylloc;
                symbol = lex();
            }

            // Try to recover from error
            if (error_rule_depth === false) {
                throw new Error(errStr || 'Parsing halted. No suitable error recovery rule available.');
            }
            
            popStack(error_rule_depth);

            preErrorSymbol = (symbol == TERROR ? null : symbol); // Save the lookahead token
            symbol = TERROR;         // Insert generic error symbol as new lookahead
            state = stack[stack.length-1];
            action = table[state] && table[state][TERROR];
            recovering = 3; // Allow 3 real symbols to be shifted before reporting a new error
        }

        // This shouldn't happen, unless resolve defaults are off
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: '+state+', token: '+symbol);
        }

        // Process the action
        switch (action[0]) {
            case constants.SHIFT: // shift
                stack.push(symbol);
                vstack.push(lexer.yytext);
                lstack.push(lexer.yylloc);
                stack.push(action[1]); // Push state
                symbol = null;
                
                if (!preErrorSymbol) { // Normal execution/no error
                    yyleng = lexer.yyleng;
                    yytext = lexer.yytext;
                    yylineno = lexer.yylineno;
                    yyloc = lexer.yylloc;
                    if (recovering > 0) {
                        recovering--;
                    }
                } else {
                    // Error just occurred, resume old lookahead from before error
                    symbol = preErrorSymbol;
                    preErrorSymbol = null;
                }
                break;

            case constants.REDUCE: // reduce
                len = this.productions_[action[1]][1];

                // Perform semantic action
                yyval.$ = vstack[vstack.length-len]; // default to $$ = $1
                
                // Default location, uses first token for firsts, last for lasts
                yyval._$ = {
                    first_line: lstack[lstack.length-(len||1)].first_line,
                    last_line: lstack[lstack.length-1].last_line,
                    first_column: lstack[lstack.length-(len||1)].first_column,
                    last_column: lstack[lstack.length-1].last_column
                };
                
                if (ranges) {
                    yyval._$.range = [lstack[lstack.length-(len||1)].range[0], lstack[lstack.length-1].range[1]];
                }
                
                r = this.performAction.apply(yyval, [yytext, yyleng, yylineno, sharedState.yy, action[1], vstack, lstack].concat(args));

                if (typeof r !== 'undefined') {
                    return r;
                }

                // Pop off stack
                if (len) {
                    stack = stack.slice(0, -1 * len * 2);
                    vstack = vstack.slice(0, -1 * len);
                    lstack = lstack.slice(0, -1 * len);
                }

                stack.push(this.productions_[action[1]][0]);    // Push nonterminal (reduce)
                vstack.push(yyval.$);
                lstack.push(yyval._$);
                
                // Goto new state = table[STATE][NONTERMINAL]
                newState = table[stack[stack.length-2]][stack[stack.length-1]];
                stack.push(newState);
                break;

            case constants.ACCEPT: // accept
                return true;
        }
    }
};

// Initialize the parser from a specified table
parser.init = function parser_init(dict) {
    this.table = dict.table;
    this.defaultActions = dict.defaultActions;
    this.performAction = dict.performAction;
    this.productions_ = dict.productions_;
    this.symbols_ = dict.symbols_;
    this.terminals_ = dict.terminals_;
};

// Create a parser constructor function
function Parser() {
    this.yy = {};
}

Parser.prototype = parser;
parser.Parser = Parser;

module.exports = parser;