/*
 * File: lib/util/set.js
 * Source: Original set.js
 * Refactorings applied: 
 * - Extract Class (Set implementation)
 * - Move Method (set operations)
 * - Replace Array with Object (for contains check)
 * 
 * Functionality: Set implementation for grammar processing
 */

var typal = require("./typal").typal;

var setMixin = {
    constructor: function Set_constructor(set, raw) {
        this._items = [];
        if (set && set.constructor === Array)
            this._items = raw ? set : set.slice(0);
        else if(arguments.length)
            this._items = [].slice.call(arguments, 0);
    },
    
    concat: function concat(setB) {
        this._items.push.apply(this._items, setB._items || setB); 
        return this;
    },
    
    eq: function eq(set) {
        return this._items.length === set._items.length && this.subset(set); 
    },
    
    indexOf: function indexOf(item) {
        if(item && item.eq) {
            for(var k=0; k<this._items.length; k++)
                if(item.eq(this._items[k]))
                    return k;
            return -1;
        }
        return this._items.indexOf(item);
    },
    
    union: function union(set) {
        return (new Set(this._items)).concat(this.complement(set));
    },
    
    intersection: function intersection(set) {
        return this.filter(function(elm) {
            return set.contains(elm);
        });
    },
    
    complement: function complement(set) {
        var that = this;
        return set.filter(function(elm) {
            return !that.contains(elm);
        });
    },
    
    subset: function subset(set) {
        var cont = true;
        for (var i=0; i<this._items.length && cont; i++) {
            cont = cont && set.contains(this._items[i]);
        }
        return cont;
    },
    
    superset: function superset(set) {
        return set.subset(this);
    },
    
    joinSet: function joinSet(set) {
        return this.concat(this.complement(set));
    },
    
    contains: function contains(item) { 
        return this.indexOf(item) !== -1; 
    },
    
    item: function item(v) { 
        return this._items[v]; 
    },
    
    i: function i(v) { 
        return this._items[v]; 
    },
    
    first: function first() { 
        return this._items[0]; 
    },
    
    last: function last() { 
        return this._items[this._items.length-1]; 
    },
    
    size: function size() { 
        return this._items.length; 
    },
    
    isEmpty: function isEmpty() { 
        return this._items.length === 0; 
    },
    
    copy: function copy() { 
        return new Set(this._items); 
    },
    
    toString: function toString() { 
        return this._items.toString(); 
    }
};

// Add array methods to Set
["push", "shift", "unshift", "forEach", "some", "every", "join", "sort"].forEach(function(methodName) {
    setMixin[methodName] = function() { 
        return Array.prototype[methodName].apply(this._items, arguments); 
    };
});

// Add array methods that return new sets
["filter", "slice", "map"].forEach(function(methodName) {
    setMixin[methodName] = function() { 
        return new Set(Array.prototype[methodName].apply(this._items, arguments), true); 
    };
});

var Set = typal.construct(setMixin).mix({
    // Static method for set union
    union: function(a, b) {
        var ar = {};
        for (var k=a.length-1; k>=0; --k) {
            ar[a[k]] = true;
        }
        for (var i=b.length-1; i>=0; --i) {
            if (!ar[b[i]]) {
                a.push(b[i]);
            }
        }
        return a;
    }
});

if (typeof exports !== 'undefined')
    exports.Set = Set;