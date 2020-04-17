let async = require('async');

let svr = {

};

svr.client = null;

svr.emptyCallback = err => {
    if (err) {
    }
}

svr.set = (key, value, expire, callback = svr.emptyCallback) => {
    if (!!svr.client) {
        if (value) {
            let obj = JSON.stringify(value);
            if (expire) {
                svr.client.setex(key, expire, obj, callback);
            } else {
                svr.client.del(key, callback);
            }
        } else {
            svr.client.del(key, callback);
        }
    } else {
        callback(null, null);
    }
}

svr.del = (key, callback = svr.emptyCallback) => {
    if (!!svr.client) {
        svr.client.del(key, callback);
    }
}

svr.clear = (pattern, callback = svr.emptyCallback) => {
    if (!!svr.client) {
        // get keys by pattern
        svr.client.keys(pattern, (err, keys) => {
            svr.del(keys);
        });
    }
}

svr.get = (key, callback = svr.emptyCallback) => {

    // return callback(null, null);

    if (!!svr.client) {
        svr.client.get(key, function (err, reply) {
            if (!!reply) {
                let obj = JSON.parse(reply);
                callback(null, obj);
            } else {
                callback(null, null);
            }
        });
    } else {
        callback(null, null);
    }
}

module.exports = svr;
