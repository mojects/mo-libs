var pg = require('pg');
pg.defaults.poolSize = 18;

var Q = require('q'),
    util = require('util'),
    log = require('mo-log');

var Query = function() {
    this.name = null;
    this.text = null;
    this.values = null;
};

var query = function(text, values, callback) {
    var q = new Query();

    //normalize params
    if(typeof values == 'function') {
        callback = values;
        values = [];
    }

    if(typeof text === 'string') {
        q.text = text;
        q.values = values;
    } else if(typeof text === 'object') {
        //support toQuery and object style interface
        q = text.toQuery ? text.toQuery() : text;
    }

    var defer;
    if(typeof callback === 'undefined' && !q.submit) {
        defer = Q.defer();
        callback = defer.resolve;
    }

    var host = process.env.DATABASE_URL;
    (query.pg || pg).connect(host, function(err, client, done) {
        var onError = function(err) {
            if (defer) defer.reject(err);
            if (/duplicate key value violates unique constraint/.exec(err))
                done();
            else {
                log.error(err, values);
                done(err);
            }
        };

        var onSuccess = function(res) {
            done();
            try {
                callback(res.rows, res);
            } catch(e) {
                log.error('DB Callback error:', e);
            }
        };

        if (err) return onError(err);

        //console.log('Will do:', text, values);

        var qry = client.query(q, function(error, result) {
            if (error) onError(error + ' Q:' + text);
            else onSuccess(result)
        });
        query.before(qry, client);

    });

    if(defer) {
        return defer.promise;
    }
    return q;
};

query.before = function(query, client) {

};

query.first = function(text, values, cb) {
    if(typeof values == 'function') {
        cb = values;
        values = []
    }
    if(values && !util.isArray(values)) {
        values = [values]
    }
    query(text, values, function(rows) {
        return cb(rows ? rows[0] : null)
    })
};

module.exports = {
    query
};
