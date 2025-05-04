# Create directories
mkdir -p lib/core lib/generators lib/util lib/cli

# Create core files
touch lib/core/parser.js
touch lib/core/production.js
touch lib/core/nonterminal.js
touch lib/core/item.js
touch lib/core/item-set.js

# Create generator files
touch lib/generators/generator-base.js
touch lib/generators/lr0-generator.js
touch lib/generators/lalr-generator.js
touch lib/generators/slr-generator.js
touch lib/generators/lr1-generator.js
touch lib/generators/ll-generator.js

# Create utility files
touch lib/util/set.js
touch lib/util/typal.js
touch lib/util/lookahead-mixin.js
touch lib/util/lr-generator-mixin.js
touch lib/util/debug-mixins.js

# Create CLI files
touch lib/cli/index.js

# Create main entry point
touch lib/jison.js