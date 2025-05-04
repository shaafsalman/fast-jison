
    %lex
    %%
    \s+          /* skip whitespace */
    [0-9]+        return 'NUMBER'
    "+"           return '+'
    <<EOF>>       return 'EOF'
    /lex
    
    %%
    
    expressions
        : e EOF
            { return $1; }
        ;
    
    e
        : e '+' NUMBER
            { $$ = $1 + Number($3); }
        | NUMBER
            { $$ = Number($1); }
        ;
  