/**
 * File: lib/cli.js
 * Source: Original lib/cli.js
 * Refactorings: Extract Method, Replace Constructor with Factory Method
 * Functionality: Command-line interface for the library
 */

const JisonEngine = require('./core/jison-engine');
const ParserFactory = require('./factories/parser-factory');
const LexerFactory = require('./factories/lexer-factory');
const fs = require('fs');
const path = require('path');

// Extract Method: Process command-line arguments
function parseArguments(args) {
  const options = {};
  let grammarFile = null;
  let outputFile = null;
  
  args.forEach((arg, i) => {
    if (arg === '-o' && args[i+1]) {
      outputFile = args[i+1];
    } else if (arg === '--module-type' && args[i+1]) {
      options.moduleType = args[i+1];
    } else if (!arg.startsWith('-') && !grammarFile) {
      grammarFile = arg;
    }
  });
  
  return { grammarFile, outputFile, options };
}

// Extract Method: Read grammar from file
function readGrammarFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const ext = path.extname(filePath);
    
    if (ext === '.json') {
      return JSON.parse(content);
    } else {
      // Assume it's a .jison file
      // Simple parser for demonstration
      return { type: 'bnf', productions: content.split('\n') };
    }
  } catch (err) {
    console.error(`Error reading grammar file: ${err.message}`);
    process.exit(1);
  }
}

// Replace Method with Method Object: Run CLI
function run(args) {
  const { grammarFile, outputFile, options } = parseArguments(args);
  
  if (!grammarFile) {
    console.error('Grammar file is required');
    process.exit(1);
  }
  
  const grammar = readGrammarFile(grammarFile);
  const jisonEngine = new JisonEngine(grammar, options);
  const output = jisonEngine.generate();
  
  if (outputFile) {
    fs.writeFileSync(outputFile, output);
    console.log(`Parser written to ${outputFile}`);
  } else {
    console.log(output);
  }
}

module.exports = { run };