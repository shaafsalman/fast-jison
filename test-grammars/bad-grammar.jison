
    /* Bad calculator grammar with syntax errors */
    %lex
    %%
    \s+                   /* skip whitespace */
    [0-9]+                 return 'NUMBER'
    "+"                    return '+'
    /* Missing %% */
    
    expressions
        : e EOF
            { return $1; }
        ;
    
    e
        : e '+' e
            { $$ = $1 + $3; }
        | NUMBER
            { $$ = Number(yytext); }
        ;
  