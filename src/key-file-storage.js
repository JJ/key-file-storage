var keyFileBasic = require("./key-file-basic");

module.exports = createKfs;

function createKfs(kfsPath, cache) {

    var kfb = keyFileBasic(kfsPath, cache);

    // The produced promise or callback function related to the latest async 'in' operator
    var hasAsyncHandler = null;

    /* async has */
    var hasAsyncWrap = {
        has: function(target, property) {
            var promise = kfb.hasAsync(property);
            if (typeof hasAsyncHandler === 'function') {
                callbackizePromise(promise, hasAsyncHandler);
            }
            else {
                hasAsyncHandler = promise;
            }
            return false; // No synchronous answer.
        }
    };

    var kfs = new Proxy(function() {

        var a1 = arguments[0],
            a2 = arguments[1],
            a3 = arguments[2];

        switch (arguments.length) {

            case 0:
                if (hasAsyncHandler) {
                    a3 = hasAsyncHandler;
                    hasAsyncHandler = null;
                    return a3;
                }
                else {
                    return new Proxy({}, hasAsyncWrap);
                }
                // break;

            case 1:
                if (typeof a1 === 'function') {
                    if (hasAsyncHandler) {
                        a3 = hasAsyncHandler;
                        hasAsyncHandler = null;
                        return callbackizePromise(a3, a1);
                    }
                    else {
                        hasAsyncHandler = a1;
                        return new Proxy({}, hasAsyncWrap);
                    }
                }
                else {
                    /* async get pr */
                    return kfb.getAsync(a1);
                }
                // break;

            case 2:
                if (typeof a2 === 'function') {
                    /* async get cb */
                    return callbackizePromise(kfb.getAsync(a1), a2);
                }
                else {
                    /* async set pr */
                    return kfb.setAsync(a1, a2);
                }
                // break;

            case 3:
                if (typeof a3 === 'function') {
                    /* async set cb */
                    return callbackizePromise(kfb.setAsync(a1, a2), a3);
                }
                // break;

        }

        throw new Error('Invalid input argument(s).');

    }, {

        /* sync set */
        set: function(target, property, value, receiver) {
            return kfb.setSync(property, value);
        },

        /* sync get */
        get: function(target, property, receiver) {
            return kfb.getSync(property);
        },

        /* sync delete */
        deleteProperty: function(target, property) {
            return kfb.deleteSync(property);
        },

        /* sync has */
        has: function(target, property) {
            return kfb.hasSync(property);
        },

        /* async delete */
        construct: function(target, argumentsList, newTarget) {

            var a1 = argumentsList[0],
                a2 = argumentsList[1];

            switch (argumentsList.length) {

                case 0:
                    return kfb.clearAsync();
                    // break;

                case 1:
                    return kfb.deleteAsync(a1);
                    // break;

                case 2:
                    return callbackizePromise(kfb.deleteAsync(a1), a2);
                    // break;

            }

            throw new Error('Invalid input argument(s).');

        }

    });

    return kfs;

    function callbackizePromise(promise, callback) {
        if (typeof callback === "function") {
            return promise.then(function(data) {
                return callback(undefined, data);
            }, callback);
        }
        else {
            return promise;
        }
    }

}