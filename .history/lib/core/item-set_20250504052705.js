/*
 * File: lib/core/item-set.js
 * Source: Extracted from jison.js
 * Refactorings applied: 
 * - Extract Class (ItemSet)
 * - Move Method (ItemSet-related functionality)
 * 
 * Functionality: Represents a set of LR items in the parsing algorithm
 */

var typal = require("../util/typal").typal;
var Set = require("../util/set").Set;

var ItemSet = Set.prototype.construct({
    afterconstructor: function() {
        this.reductions = [];
        this.goes = {};
        this.edges = {};
        this.shifts = false;
        this.inadequate = false;
        this.hash_ = {};
        for (var i = this._items.length - 1; i >= 0; i--) {
            this.hash_[this._items[i].id] = true;
        }
    },
    
    concat: function concat(set) {
        var a = set._items || set;
        for (var i = a.length - 1; i >= 0; i--) {
            this.hash_[a[i].id] = true;
        }
        this._items.push.apply(this._items, a);
        return this;
    },
    
    push: function(item) {
        this.hash_[item.id] = true;
        return this._items.push(item);
    },
    
    contains: function(item) {
        return this.hash_[item.id];
    },
    
    valueOf: function toValue() {
        var v = this._items.map(function(a) {
            return a.id;
        }).sort().join('|');
        this.valueOf = function toValue_inner() {
            return v;
        };
        return v;
    }
});

exports.ItemSet = ItemSet;