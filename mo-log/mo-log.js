var rollbar = require("rollbar");

var rollbar_token = process.env.ROLLBAR_ACCESS_TOKEN;
if (rollbar_token)
    rollbar.init(rollbar_token);

var logger = log.bind('log');
logger.info = log.bind('info');
logger.error = log.bind('error');
logger.warn = log.bind('warn');
module.exports = logger;

function log() {
    call(console[this], arguments);

    if (rollbar_token &&
        (this == 'error' || this == 'warn')) {
        rollbar.reportMessageWithPayloadData(arguments[0], {
            level: this,
            custom: arguments
        });
    }
}

function call(func, agrs) {
    func.apply(func, agrs);
}

// Unhandled exceptions to rollbar:
var handleExceptions = true;
if (typeof process.env.SUPPRESS_EXCEPTIONS_TO_ROLLBAR !== 'undefined') {
    handleExceptions = !!process.env.SUPPRESS_EXCEPTIONS_TO_ROLLBAR;
}

if (rollbar_token && handleExceptions) {
    rollbar.handleUncaughtExceptions(rollbar_token, {
        exitOnUncaughtException: true
    });
}