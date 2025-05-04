
/* Calculator grammar */
%{
  function factorial(n) {
    if (n === 0) return 1;
    return n * factorial(n - 1);
  }
%}

%lex
%%
\s+                   /* skip whitespace */
[0-9]+("."[0-9]+)?\b  return 'NUMBER'
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
