
%{
  // Lexer code
%}

%%
\s+               /* skip whitespace */
[0-9]+("."[0-9]+)? return 'NUMBER'
"*"                return '*'
"+"                return '+'
"("                return '('
")"                return ')'
<<EOF>>            return 'EOF'
.                  return 'INVALID'
