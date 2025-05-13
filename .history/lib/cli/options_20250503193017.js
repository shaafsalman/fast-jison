/**
 * lib/cli/options.js
 * 
 * Command-line options processing
 * 
 * Refactorings applied:
 * - Extract Method: Separated command-line option processing
 * - Parameterize Method: Made option processing more flexible
 */

"use strict";

/**
 * Get command line options using nomnom
 * @returns {Object} - Parsed command line options
 */
function getCommandlineOptions() {
    const version = require('../../package.json').version;
    const opts = require("nomnom")
        .script('jison')
        .option('file', {
            flag: true,
            position: 0,
            help: 'file containing a grammar'
        })
        .option('lexfile', {
            flag: true,
            position: 1,
            help: 'file containing a lexical grammar'
        })
        .option('json', {
            abbr: 'j',
            flag: true,
            help: 'force jison to expect a grammar in JSON format'
        })
        .option('outfile', {
            abbr: 'o',
            metavar: 'FILE',
            help: 'Filename and base module name of the generated parser'
        })
        .option('debug', {
            abbr: 't',
            flag: true,
            default: false,
            help: 'Debug mode'
        })
        .option('module-type', {
            abbr: 'm',
            default: 'commonjs',
            metavar: 'TYPE',
            help: 'The type of module to generate (commonjs, amd, js)'
        })
        .option('parser-type', {
            abbr: 'p',
            default: 'lalr',
            metavar: 'TYPE',
            help: 'The type of algorithm to use for the parser (lr0, slr, lalr, lr)'
        })
        .option('version', {
            abbr: 'V',
            flag: true,
            help: 'print version and exit',
            callback: function() {
                return version;
            }
        }).parse();

    return opts;
}

/**
 * Build settings object from