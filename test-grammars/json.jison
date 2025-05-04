
/** JSON grammar from json.org */

%lex

%%
\s+             /* skip whitespace */
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
'"'([^\""]|\\.)*'"'    return 'STRING'
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
