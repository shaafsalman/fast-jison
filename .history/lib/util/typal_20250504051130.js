/*
 * File: lib/util/typal.js
 * 
 * Refactorings applied:
 * - Extract Method: Separated functionality into discrete methods
 * - Replace Temp with Query: Eliminated temporary variables
 * - Remove Middle Man: Direct access to prototype methods
 * 
 * Functionality: Provides a utility for classical/prototypal patterns with AOP sugar
 */

// Create a typal object to make classical/prototypal patterns easier with AOP sugar
var typal = (function () {

    var create = Object.create || function (o) { 
        function F(){} 
        F.prototype = o; 
        return new F(); 
    };
    
    var position = /^(before|after)/;

    // Basic method layering - always returns original method's return value
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

    // Mixes each argument's own properties into calling object,
    // overwriting them or layering them
    function typal_mix() {
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
        // Extend object with own properties of each argument
        mix: typal_mix,

        // Sugar for object begetting and mixing
        beget: function typal_beget() {
            return arguments.length ? typal_mix.apply(create(this), arguments) : create(this);
        },

        // Creates a new Class function based on an object with a constructor method
        construct: function typal_construct() {
            var o = typal_mix.apply(create(this), arguments);
            var constructor = o.constructor;
            var Klass = o.constructor = function () { return constructor.apply(this, arguments); };
            Klass.prototype = o;
            Klass.mix = typal_mix; // Allow for easy singleton property extension
            return Klass;
        },

        // No op constructor
        constructor: function typal_constructor() { return this; }
    };
})();

if (typeof exports !== 'undefined')
    exports.typal = typal;