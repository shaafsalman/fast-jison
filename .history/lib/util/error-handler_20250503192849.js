/**
 * lib/util/error-handler.js
 * 
 * Error handling utilities for Jison
 * 
 * Refactorings applied:
 * - Replace Error Code with Exception: Created specialized error classes
 * - Extract Method: Separated error handling logic
 */

"use strict";

/**
 * Base Jison error class
 */
class JisonError extends Error {
    constructor(message) {
        super(message);
        this.name = 'JisonError';
        
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

/**
 * Error related to grammar definition
 */
class GrammarError extends JisonError {
    constructor(message) {
        super(message);
        this.name = 'GrammarError';
    }
}

/**
 * Error during parsing process
 */
class ParseError extends JisonError {
    constructor(message, hash) {
        super(message);
        this.name = 'ParseError';
        this.hash = hash || {};
    }
}

/**
 * Error in lexical analysis
 */
class LexError extends JisonError {
    constructor(message, hash) {
        super(message);
        this.name = 'LexError';
        this.hash = hash || {};
    }
}

/**
 * Standard parse error handler function
 * @param {String} str - Error message
 * @param {Object} hash - Error details
 */
function parseError(str, hash) {
    if (hash && hash.recoverable) {
        this.trace(str);
    } else {
        throw new ParseError(str, hash);
    }
}

/**
 * Trace-based parse error handler
 * @param {String} err - Error message
 * @param {Object} hash - Error details
 */
function traceParseError(err, hash) {
    this.trace(err);
}

module.exports = {
    JisonError,
    GrammarError,
    ParseError,
    LexError,
    parseError,
    traceParseError
};