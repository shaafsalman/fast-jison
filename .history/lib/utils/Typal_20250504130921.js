/*
 * File: lib/utils/Typal.js
 * Source: Original file typal.js
 * Refactorings applied: 
 *   - Extract Method: Separated methods into more concise functions
 *   - Simplifying Conditional Expressions: Cleaned up method layering logic
 * Functionality: Provides a typal object for classical/prototypal patterns
 */

var typal = (function () {
    var create = Object.create || function (o) { 
        function F(){} 
        F.prototype = o; 
        return new F(); 
    };
    var position = /^(before|after)/;

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

    function typal_mix() {
        var self = this;
        for(var i=0,o,k; i<arguments.length; i++) {
            o=arguments[i];
            if (!o) continue;
            if (Object.prototype.hasOwnProperty.call(o,'constructor'))
                this.constructor = o.constructor;
            if (Object.prototype.hasOwnProperty.call(o,'toString'))
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
        mix: typal_mix,
        beget: function typal_beget() {
            return arguments.length ? typal_mix.apply(create(this), arguments) : create(this);
        },
        construct: function typal_construct() {
            var o = typal_mix.apply(create(this), arguments);
            var constructor = o.constructor;
            var Klass = o.constructor = function () { return constructor.apply(this, arguments); };
            Klass.prototype = o;
            Klass.mix = typal_mix;
            return Klass;
        },
        constructor: function typal_constructor() { return this; }
    };
})();

exports.typal = typal;