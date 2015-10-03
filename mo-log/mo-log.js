var winston = require('winston');
require('winston-rollbar');

var trans = [];

trans.push(new (winston.transports.Console)({
    level: process.env.LOG_LEVEL || 'info'
}));

var rollbar_token = process.env.ROLLBAR_ACCESS_TOKEN;
if (rollbar_token)
    trans.push(new (winston.transports.Rollbar)({
        rollbarAccessToken: rollbar_token,
        level: 'warn'
    }));

var logger = new (winston.Logger)({
    transports: trans,
    exitOnError: false
});

module.exports = {
    info: logger.info,
    error: logger.error,
    verbose: logger.verbose,
    warn: logger.warn
};

// Unhandled exceptions to rollbar:

var handleExceptions = true;
if (typeof process.env.SUPPRESS_EXCEPTIONS_TO_ROLLBAR !== 'undefined') {
    handleExceptions = !!process.env.SUPPRESS_EXCEPTIONS_TO_ROLLBAR;
}

if (rollbar_token && handleExceptions) {
    var rollbar = require("rollbar");
    rollbar.handleUncaughtExceptions(rollbar_token, {
        exitOnUncaughtException: true
    });
}