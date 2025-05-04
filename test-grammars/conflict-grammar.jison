
    /* Grammar with shift/reduce conflicts */
    %lex
    %%
    \s+               /* skip whitespace */
    "if"               return 'IF'
    "else"             return 'ELSE'
    "then"             return 'THEN'
    [a-zA-Z]+          return 'ID'
    ";"                return ';'
    <<EOF>>            return 'EOF'
    .                  return 'INVALID'
    /lex
    
    %start program
    
    %%
    
    program
        : stmt EOF
            { return $1; }
        ;
        
    stmt
        : IF expr THEN stmt
            { $$ = {type: 'if', condition: $2, then: $4}; }
        | IF expr THEN stmt ELSE stmt
            { $$ = {type: 'if_else', condition: $2, then: $4, else: $6}; }
        | ID ';'
            { $$ = {type: 'id', name: $1}; }
        ;
        
    expr
        : ID
            { $$ = {type: 'id', name: $1}; }
        ;
  