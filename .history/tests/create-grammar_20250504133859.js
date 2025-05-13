/**
 * Creates sample grammars for testing
 */

const fs = require('fs');
const path = require('path');

const EXAMPLES_DIR = path.join(__dirname, '../test-grammars');

if (!fs.existsSync(EXAMPLES_DIR)) {
  fs.mkdirSync(EXAMPLES_DIR, { recursive: true });
}

// Simple calculator grammar
const calculatorGrammar = `
/* Calculator grammar */
%{
  function factorial(n) {
    if (n === 0) return 1;
    return n * factorial(n - 1);
  }
%}

%lex
%%
\\s+                   /* skip whitespace */
[0-9]+("."[0-9]+)?\\b  return 'NUMBER'
"*"                    return '*'
"/"                    return '/'
"-"                    return '-'
"+"                    return '+'
"^"                    return '^'
"!"                    return '!'
"("                    return '('
")"                    return ')'
"PI"                   return 'PI'
"E"                    return 'E'
<<EOF>>                return 'EOF'
.                      return 'INVALID'

/lex

%left '+' '-'
%left '*' '/'
%left '^'
%left '!'
%left UMINUS

%start expressions

%%

expressions
    : e EOF
        { return $1; }
    ;

e
    : e '+' e
        { $$ = $1 + $3; }
    | e '-' e
        { $$ = $1 - $3; }
    | e '*' e
        { $$ = $1 * $3; }
    | e '/' e
        { $$ = $1 / $3; }
    | e '^' e
        { $$ = Math.pow($1, $3); }
    | e '!'
        { $$ = factorial($1); }
    | '-' e %prec UMINUS
        { $$ = -$2; }
    | '(' e ')'
        { $$ = $2; }
    | NUMBER
        { $$ = Number(yytext); }
    | E
        { $$ = Math.E; }
    | PI
        { $$ = Math.PI; }
    ;
`;

// Simple JSON grammar
const jsonGrammar = `
/** JSON grammar from json.org */

%lex

%%
\\s+             /* skip whitespace */
"{"              return '{'
"}"              return '}'
"["              return '['
"]"              return ']'
","              return ','
":"              return ':'
"true"           return 'TRUE'
"false"          return 'FALSE'
"null"           return 'NULL'
[0-9]+("."[0-9]+)?([eE][-+]?[0-9]+)?  return 'NUMBER'
'"'([^\\""]|\\\\.)*'"'    return 'STRING'
<<EOF>>          return 'EOF'
.                return 'INVALID'

/lex

%start JSONText

%%

JSONText
    : JSONValue EOF
        { return $1; }
    ;

JSONValue
    : JSONNullLiteral
        { $$ = null; }
    | JSONBooleanLiteral
        { $$ = $1 === 'true'; }
    | JSONString
        { $$ = JSON.parse($1); }
    | JSONNumber
        { $$ = Number($1); }
    | JSONObject
        { $$ = $1; }
    | JSONArray
        { $$ = $1; }
    ;

JSONNullLiteral
    : NULL
    ;

JSONBooleanLiteral
    : TRUE
    | FALSE
    ;

JSONString
    : STRING
    ;

JSONNumber
    : NUMBER
    ;

JSONObject
    : '{' '}'
        { $$ = {}; }
    | '{' JSONMemberList '}'
        { $$ = $2; }
    ;

JSONMemberList
    : JSONMember
        { $$ = {}; $$[$1[0]] = $1[1]; }
    | JSONMemberList ',' JSONMember
        { $$ = $1; $1[$3[0]] = $3[1]; }
    ;

JSONMember
    : JSONString ':' JSONValue
        { $$ = [JSON.parse($1), $3]; }
    ;

JSONArray
    : '[' ']'
        { $$ = []; }
    | '[' JSONElementList ']'
        { $$ = $2; }
    ;

JSONElementList
    : JSONValue
        { $$ = [$1]; }
    | JSONElementList ',' JSONValue
        { $$ = $1; $1.push($3); }
    ;
`;

// Calculator grammar split into grammar and lexer
const calculatorSplitGrammar = `
%{
  // Parser code
%}

%start expressions

%%

expressions
    : e EOF
        { return $1; }
    ;

e
    : e '+' t
        { $$ = $1 + $3; }
    | t
        { $$ = $1; }
    ;

t
    : t '*' f
        { $$ = $1 * $3; }
    | f
        { $$ = $1; }
    ;

f
    : NUMBER
        { $$ = Number(yytext); }
    | '(' e ')'
        { $$ = $2; }
    ;
`;

const calculatorLexer = `
%{
  // Lexer code
%}

%%
\\s+               /* skip whitespace */
[0-9]+("."[0-9]+)? return 'NUMBER'
"*"                return '*'
"+"                return '+'
"("                return '('
")"                return ')'
<<EOF>>            return 'EOF'
.                  return 'INVALID'
`;

// Calculator grammar in JSON format
const calculatorJsonGrammar = {
  "lex": {
    "rules": [
      ["\\s+", "/* skip whitespace */"],
      ["[0-9]+(\\.?[0-9]*)?\\b", "return 'NUMBER';"],
      ["\\*", "return '*';"],
      ["\\/", "return '/';"],
      ["\\-", "return '-';"],
      ["\\+", "return '+';"],
      ["\\^", "return '^';"],
      ["\\!", "return '!';"],
      ["\\(", "return '(';"],
      ["\\)", "return ')';"],
      ["PI", "return 'PI';"],
      ["E", "return 'E';"],
      ["$", "return 'EOF';"],
      [".", "return 'INVALID';"]
    ]
  },
  "operators": [
    ["left", "+", "-"],
    ["left", "*", "/"],
    ["left", "^"],
    ["left", "!"],
    ["left", "UMINUS"]
  ],
  "bnf": {
    "expressions": [
      ["e EOF", "return $1;"]
    ],
    "e": [
      ["e + e", "$$ = $1 + $3;"],
      ["e - e", "$$ = $1 - $3;"],
      ["e * e", "$$ = $1 * $3;"],
      ["e / e", "$$ = $1 / $3;"],
      ["e ^ e", "$$ = Math.pow($1, $3);"],
      ["e !", "$$ = factorial($1);"],
      ["- e %prec UMINUS", "$$ = -$2;"],
      ["( e )", "$$ = $2;"],
      ["NUMBER", "$$ = Number(yytext);"],
      ["E", "$$ = Math.E;"],
      ["PI", "$$ = Math.PI;"]
    ]
  }
};

// Write the sample grammars to files
fs.writeFileSync(path.join(EXAMPLES_DIR, 'calculator.jison'), calculatorGrammar);
fs.writeFileSync(path.join(EXAMPLES_DIR, 'json.jison'), jsonGrammar);
fs.writeFileSync(path.join(EXAMPLES_DIR, 'calc-grammar.jison'), calculatorSplitGrammar);
fs.writeFileSync(path.join(EXAMPLES_DIR, 'calc-lexer.jisonlex'), calculatorLexer);
fs.writeFileSync(path.join(EXAMPLES_DIR, 'calculator.json'), JSON.stringify(calculatorJsonGrammar, null, 2));

console.log('Sample grammars created successfully');