/**
 * lib/util/set.js
 * 
 * Set implementation for working with collections
 * 
 * Refactorings applied:
 * - Extract Method: Separated logic into focused methods
 * - Replace Array with Object: Enhanced array-based implementation with proper methods
 */

"use strict";

const { typal } = require("./typal");

/**
 * Set operations and utilities implemented as a wrapper around arrays
 */
const setMixin = {
    /**
     * Create a new Set
     * @param {Array|*} set - Initial set items
     * @param {Boolean} raw - If true, use set directly without copying
     */
    constructor: function Set_constructor(set, raw) {
        this._items = [];
        
        if (set && Array.isArray(set)) {
            this._items = raw ? set : set.slice(0);
        } else if (arguments.length) {
            this._items = Array.prototype.slice.call(arguments, 0);
        }
    },
    
    /**
     * Concatenate another set or array to this set
     * @param {Object|Array} setB - Set or array to concatenate
     * @returns {Object} This set for chaining
     */
    concat: function concat(setB) {
        const items = setB._items || setB;
        Array.prototype.push.apply(this._items, items);
        return this;
    },
    
    /**
     * Check if this set equals another set
     * @param {Object} set - Set to compare with
     * @returns {Boolean} True if sets are equal
     */
    eq: function eq(set) {
        return this._items.length === set._items.length && this.subset(set);
    },
    
    /**
     * Find the index of an item in the set
     * @param {*} item - Item to find
     * @returns {Number} Index of the item or -1 if not found
     */
    indexOf: function indexOf(item) {
        if (item && item.eq) {
            for (let k = 0; k < this._items.length; k++) {
                if (item.eq(this._items[k])) {
                    return k;
                }
            }
            return -1;
        }
        return this._items.indexOf(item);
    },
    
    /**
     * Create a union of this set and another set
     * @param {Object} set - Set to union with
     * @returns {Object} New set containing the union
     */
    union: function union(set) {
        return (new Set(this._items)).concat(this.complement(set));
    },
    
    /**
     * Create an intersection of this set and another set
     * @param {Object} set - Set to intersect with
     * @returns {Object} New set containing the intersection
     */
    intersection: function intersection(set) {
        return this.filter(function(elm) {
            return set.contains(elm);
        });
    },
    
    /**
     * Get the complement of a set relative to this set
     * @param {Object} set - Set to complement
     * @returns {Object} New set containing the complement
     */
    complement: function complement(set) {
        const that = this;
        return set.filter(function(elm) {
            return !that.contains(elm);
        });
    },
    
    /**
     * Check if this set is a subset of another set
     * @param {Object} set - Potential superset
     * @returns {Boolean} True if this set is a subset
     */
    subset: function subset(set) {
        let cont = true;
        for (let i = 0; i < this._items.length && cont; i++) {
            cont = cont && set.contains(this._items[i]);
        }
        return cont;
    },
    
    /**
     * Check if this set is a superset of another set
     * @param {Object} set - Potential subset
     * @returns {Boolean} True if this set is a superset
     */
    superset: function superset(set) {
        return set.subset(this);
    },
    
    /**
     * Join this set with another set
     * @param {Object} set - Set to join with
     * @returns {Object} This set with items added
     */
    joinSet: function joinSet(set) {
        return this.concat(this.complement(set));
    },
    
    /**
     * Check if this set contains an item
     * @param {*} item - Item to check
     * @returns {Boolean} True if the item is in the set
     */
    contains: function contains(item) { 
        return this.indexOf(item) !== -1; 
    },
    
    /**
     * Get an item at a specific index
     * @param {Number} v - Index of the item
     * @returns {*} Item at the index
     */
    item: function item(v) { 
        return this._items[v]; 
    },
    
    /**
     * Alias for item
     */
    i: function i(v) { 
        return this._items[v]; 
    },
    
    /**
     * Get the first item in the set
     * @returns {*} First item
     */
    first: function first() { 
        return this._items[0]; 
    },
    
    /**
     * Get the last item in the set
     * @returns {*} Last item
     */
    last: function last() { 
        return this._items[this._items.length - 1]; 
    },
    
    /**
     * Get the number of items in the set
     * @returns {Number} Number of items
     */
    size: function size() { 
        return this._items.length; 
    },
    
    /**
     * Check if the set is empty
     * @returns {Boolean} True if the set is empty
     */
    isEmpty: function isEmpty() { 
        return this._items.length === 0; 
    },
    
    /**
     * Create a copy of this set
     * @returns {Object} New set with the same items
     */
    copy: function copy() { 
        return new Set(this._items); 
    },
    
    /**
     * Convert the set to a string
     * @returns {String} String representation
     */
    toString: function toString() { 
        return this._items.toString(); 
    }
};

// Add array methods that return the result on the items array
"push shift unshift forEach some every join sort".split(' ').forEach(function(e) {
    setMixin[e] = function() { 
        return Array.prototype[e].apply(this._items, arguments); 
    };
    setMixin[e].name = e;
});

// Add array methods that return a new Set
"filter slice map".split(' ').forEach(function(e) {
    setMixin[e] = function() { 
        return new Set(Array.prototype[e].apply(this._items, arguments), true); 
    };
    setMixin[e].name = e;
});

/**
 * Set class with array operations
 */
const Set = typal.construct(setMixin).mix({
    /**
     * Static union method for arrays
     * @param {Array} a - First array
     * @param {Array} b - Second array
     * @returns {Array} Union of arrays
     */
    union: function(a, b) {
        const ar = {};
        for (let k = a.length - 1; k >= 0; --k) {
            ar[a[k]] = true;
        }
        for (let i = b.length - 1; i >= 0; --i) {
            if (!ar[b[i]]) {
                a.push(b[i]);
            }
        }
        return a;
    }
});

module.exports = { Set };