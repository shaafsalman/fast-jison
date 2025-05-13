// lib/cli/index.js
// Refactored from cli.js
// Refactorings applied:
// - Separate Domain from Presentation: Separated CLI logic from core functionality
// - Extract Class: Created FileProcessor for file handling

"use strict";

const fs = require('fs');
const path = require('path');
const { getCommandlineOptions, buildSettings } = require('./options');
const GrammarProcessor = require('./grammar-processor');

/**
 * Class for handling file I/O operations
 */
class FileProcessor {
    /**
     * Read a file and return its contents
     * @param {String} filename - Path to the file
     * @returns {String} - File contents
     */
    static readFile(filename) {
        return fs.readFileSync(path.normalize(filename), 'utf8');
    }
    
    /**
     * Write content to a file
     * @param {String} filename - Path to the file
     * @param {String} content - Content to write
     */
    static writeFile(filename, content) {
        fs.writeFileSync(filename, content);
    }
    
    /**
     * Get the base name of a file without extension
     * @param {String} filename - Path to the file
     * @returns {String} - Base name
     */
    static getBaseName(filename) {
        return path.basename(filename).replace(/\..*$/g, '');
    }
    
    /**
     * Convert kebab-case to camelCase for module names
     * @param {String} name - Name to convert
     * @returns {String} - Converted name
     */
    static kebabToCamelCase(name) {
        return name.replace(/-\w/g, match => match.charAt(1).toUpperCase());
    }
}

/**
 * Main CLI functionality
 */
class CLI {
    /**
     * Execute the CLI with provided options
     * @param {Object} opts - Command line options
     */
    static main(opts) {
        opts = opts || {};
        
        if (opts.file) {
            this.processInputFile(opts);
        } else {
            this.processStdin(opts);
        }
    }
    
    /**
     * Process input from a file
     * @param {Object} opts - Command line options
     */
    static processInputFile(opts) {
        // Read the lex file if provided
        let lex;
        if (opts.lexfile) {
            lex = FileProcessor.readFile(opts.lexfile);
        }
        
        // Read the grammar file
        const raw = FileProcessor.readFile(opts.file);
        
        // Determine if the grammar is in JSON format
        opts.json = path.extname(opts.file) === '.json' || opts.json;
        
        // Set output file name and module name
        const name = FileProcessor.getBaseName(opts.outfile || opts.file);
        opts.outfile = opts.outfile || (name + '.js');
        
        if (!opts.moduleName && name) {
            opts.moduleName = FileProcessor.kebabToCamelCase(name);
        }
        
        // Process the grammar and generate the parser
        const parser = this.processGrammar(raw, lex, opts);
        FileProcessor.writeFile(opts.outfile, parser);
    }
    
    /**
     * Process input from stdin
     * @param {Object} opts - Command line options
     */
    static processStdin(opts) {
        this.readFromStdin(raw => {
            console.log(this.processGrammar(raw, null, opts));
        });
    }
    
    /**
     * Read data from stdin
     * @param {Function} callback - Function to call with the data
     */
    static readFromStdin(callback) {
        const stdin = process.stdin;
        let data = '';
        
        stdin.setEncoding('utf8');
        stdin.on('data', chunk => {
            data += chunk;
        });
        stdin.on('end', () => {
            callback(data);
        });
    }
    
    /**
     * Process grammar and generate parser
     * @param {String} raw - Raw grammar content
     * @param {String} lex - Lexical grammar content (optional)
     * @param {Object} opts - Command line options
     * @returns {String} - Generated parser code
     */
    static processGrammar(raw, lex, opts) {
        const grammarProcessor = new GrammarProcessor();
        const grammar = grammarProcessor.processGrammars(raw, lex, opts.json);
        return grammarProcessor.generateParserString(opts, grammar);
    }
}

// Add the CLI functionality to the module.exports
const cli = module.exports = CLI;

// If this script is run directly, execute the main function
if (require.main === module) {
    const opts = getCommandlineOptions();
    cli.main(opts);
}