/*
 * File: lib/util/typal.js
 * Source: Original typal.js
 * Refactorings applied: 
 * - Extract Method (simplified inheritance)
 * - Replace Conditional with Polymorphism
 * - Simplifying exports
 * 
 * Functionality: Provides object inheritance and method layering for the prototype system
 */

var typal = (function () {
    // Helper to create objects via prototypal inheritance
    var create = Object.create || function (o) { 
        function F(){} 
        F.prototype = o; 
        return new F(); 
    };
    
    // Regex to extract position from method name
    var position = /^(before|after)/;

    // Layer methods with before/after behavior
    function layerMethod(k, fun) {
        var pos = k.match(position)[0],
            key = k.replace(position, ''),
            prop = this[key];

        if (pos === 'after') {
            this[key] = function () {
                var ret = prop.apply(this, arguments);
                var args = [].slice.call(arguments);
                args.splice(0, 0, ret);
                fun.apply(this, args);
                return ret;
            };
        } else if (pos === 'before') {
            this[key] = function () {
                fun.apply(this, arguments);
                var ret = prop.apply(this, arguments);
                return ret;
            };
        }
    }

    // Mix properties from source objects into target object
    function mix() {
        var self = this;
        for(var i=0, o, k; i<arguments.length; i++) {
            o = arguments[i];
            if (!o) continue;
            if (Object.prototype.hasOwnProperty.call(o, 'constructor'))
                this.constructor = o.constructor;
            if (Object.prototype.hasOwnProperty.call(o, 'toString'))
                this.toString = o.toString;
            for(k in o) {
                if (Object.prototype.hasOwnProperty.call(o, k)) {
                    if(k.match(position) && typeof this[k.replace(position, '')] === 'function')
                        layerMethod.call(this, k, o[k]);
                    else
                        this[k] = o[k];
                }
            }
        }
        return this;
    }

    return {
        // Extend object with properties of each argument
        mix: mix,

        // Create new object with typal as prototype and mix in arguments
        beget: function beget() {
            return arguments.length ? mix.apply(create(this), arguments) : create(this);
        },

        // Create class/constructor function
        construct: function construct() {
            var o = mix.apply(create(this), arguments);
            var constructor = o.constructor;
            var Klass = o.constructor = function () { return constructor.apply(this, arguments); };
            Klass.prototype = o;
            Klass.mix = mix;
            return Klass;
        },

        // Default constructor
        constructor: function constructor() { 
            return this; 
        }
    };
})();

// Export for Node.js environment
if (typeof exports !== 'undefined') {
    exports.typal = typal;
}