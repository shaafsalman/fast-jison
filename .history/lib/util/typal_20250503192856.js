/**
 * lib/util/typal.js
 * 
 * Typal utility for object-oriented programming patterns
 * 
 * Refactorings applied:
 * - Extract Method: Separated logic into smaller, focused functions
 * - Replace Temp with Query: Improved variable handling
 */

"use strict";

/**
 * Typal provides utilities for classical/prototypal patterns
 * with some AOP (Aspect-Oriented Programming) sugar
 * 
 * By Zachary Carter <zach@carter.name>
 * MIT Licensed
 */
const typal = (function () {
    // Polyfill for Object.create
    const create = Object.create || function (o) { 
        function F(){}
        F.prototype = o;
        return new F();
    };
    
    // Regular expression to detect before/after method hooks
    const position = /^(before|after)/;
    
    /**
     * Applies method layering (AOP)
     * @param {String} k - Method name with prefix
     * @param {Function} fun - Function to layer
     * @private
     */
    function layerMethod(k, fun) {
        const pos = k.match(position)[0];
        const key = k.replace(position, '');
        const prop = this[key];

        if (pos === 'after') {
            this[key] = function () {
                const ret = prop.apply(this, arguments);
                const args = Array.prototype.slice.call(arguments);
                args.unshift(ret);
                fun.apply(this, args);
                return ret;
            };
        } else if (pos === 'before') {
            this[key] = function () {
                fun.apply(this, arguments);
                return prop.apply(this, arguments);
            };
        }
    }

    /**
     * Mixes properties from source objects into the target object
     * @returns {Object} The modified target object
     */
    function typal_mix() {
        for (let i = 0; i < arguments.length; i++) {
            const o = arguments[i];
            if (!o) continue;
            
            if (Object.prototype.hasOwnProperty.call(o, 'constructor')) {
                this.constructor = o.constructor;
            }
            
            if (Object.prototype.hasOwnProperty.call(o, 'toString')) {
                this.toString = o.toString;
            }
            
            for (const k in o) {
                if (Object.prototype.hasOwnProperty.call(o, k)) {
                    if (k.match(position) && typeof this[k.replace(position, '')] === 'function') {
                        layerMethod.call(this, k, o[k]);
                    } else {
                        this[k] = o[k];
                    }
                }
            }
        }
        return this;
    }

    // Public API
    return {
        /**
         * Extends object with properties from other objects
         */
        mix: typal_mix,

        /**
         * Creates a new object inheriting from this one and mixed with provided objects
         * Syntactic sugar for Object.create(typal).mix(etc, etc)
         */
        beget: function typal_beget() {
            return arguments.length ? 
                typal_mix.apply(create(this), arguments) : 
                create(this);
        },

        /**
         * Creates a new constructor function based on an object with a constructor method
         */
        construct: function typal_construct() {
            const o = typal_mix.apply(create(this), arguments);
            const constructor = o.constructor;
            const Klass = o.constructor = function () {
                return constructor.apply(this, arguments);
            };
            Klass.prototype = o;
            Klass.mix = typal_mix;
            return Klass;
        },

        /**
         * Default no-op constructor
         */
        constructor: function typal_constructor() {
            return this;
        }
    };
})();

module.exports = { typal };