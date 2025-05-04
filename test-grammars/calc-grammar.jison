
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
