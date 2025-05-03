/**
 * lib/parsers/lr-item.js
 * 
 * LR parser item implementations
 * 
 * Refactorings applied:
 * - Extract Class: Created reusable item classes for all LR parsers
 * - Move Method: Moved item methods from generator to dedicated classes
 */

"use strict";

const { Set } = require('../util/set');

/**
 * Represents an item in an LR parser
 */
class Item {
    /**
     * Create a new item
     * @param {Object} production - The production rule
     * @param {Number} dot - Dot position in the production
     * @param {Array} follows - Lookahead tokens
     * @param {Number} predecessor - Predecessor item index
     */
    constructor(production, dot, follows, predecessor) {
        this.production = production;
        this.dotPosition = dot || 0;
        this.follows = follows || [];
        this.predecessor = predecessor;
        this.id = parseInt(production.id + 'a' + this.dotPosition, 36);
        this.markedSymbol = this.production.handle[this.dotPosition];
    }
    
    /**
     * Get the remaining symbols after the dot
     * @returns {Array} - Remaining symbols
     */
    remainingHandle() {
        return this.production.handle.slice(this.dotPosition + 1);
    }
    
    /**
     * Check if this item equals another item
     * @param {Object} e - Item to compare with
     * @returns {Boolean} - True if items are equal
     */
    eq(e) {
        return e.id === this.id;
    }
    
    /**
     * Get a string representation of the item's handle
     * @returns {String} - String representation
     */
    handleToString() {
        const handle = this.production.handle.slice(0);
        handle[this.dotPosition] = '.' + (handle[this.dotPosition] || '');
        return handle.join(' ');
    }
    
    /**
     * Get a string representation of the item
     * @returns {String} - String representation
     */
    toString() {
        const temp = this.production.handle.slice(0);
        temp[this.dotPosition] = '.' + (temp[this.dotPosition] || '');
        return this.production.symbol + " -> " + temp.join(' ') +
            (this.follows.length === 0 ? "" : " #lookaheads= " + this.follows.join(' '));
    }
}

/**
 * Set of items with operations for LR parsing
 */
const ItemSet = Set.prototype.construct({
    /**
     * Initialize the item set
     */
    afterconstructor: function() {
        this.reductions = [];
        this.goes = {};
        this.edges = {};
        this.shifts = false;
        this.inadequate = false;
        this.hash_ = {};
        for (let i = this._items.length - 1; i >= 0; i--) {
            this.hash_[this._items[i].id] = true;
        }
    },
    
    /**
     * Concatenate another set to this set
     * @param {Object} set - Set to concatenate
     * @returns {Object} - This set for chaining
     */
    concat: function concat(set) {
        const a = set._items || set;
        for (let i = a.length - 1; i >= 0; i--) {
            this.hash_[a[i].id] = true;
        }
        this._items.push.apply(this._items, a);
        return this;
    },
    
    /**
     * Add an item to the set
     * @param {Object} item - Item to add
     * @returns {Number} - New size of the set
     */
    push: function(item) {
        this.hash_[item.id] = true;
        return this._items.push(item);
    },
    
    /**
     * Check if the set contains an item
     * @param {Object} item - Item to check
     * @returns {Boolean} - True if the set contains the item
     */
    contains: function(item) {
        return this.hash_[item.id];
    },
    
    /**
     * Get a unique value representing the set
     * @returns {String} - Unique value
     */
    valueOf: function toValue() {
        const v = this._items.map(function(a) { return a.id; }).sort().join('|');
        this.valueOf = function() { return v; };
        return v;
    }
});

module.exports = {
    Item,
    ItemSet
};