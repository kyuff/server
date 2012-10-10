(function(scope) {
    scope.LOG_FORMAT = "{{timestamp}} - {{method}} {{status}} {{&url}} [{{&patterns}}]";
    var fs = require("fs");
    var http = require('http');
    var util = require('util');
    var path = require('path');
    var Handler = require('./lib/handler.js').Handler;
    var mustache = require('mustache');
    var handlers = [];

    function serve404(req, res) {
        res.writeHead(404, {'Content-Type': 'text/plain'});
        var msg404 = ""+req.url + " findes ikke";
        res.end(msg404);
    }
    function handleRequest(req, res) {

    }

    scope.serve = function (port) {
        scope.server = http.createServer( function(req, res) {
            var chosen = null;
            req.on('end', function() {
                console.log(mustache.to_html(scope.LOG_FORMAT, {
                    method : req.method,
                    url : req.url,
                    status : res.statusCode,
                    timestamp : new Date().toISOString(),
                    patterns : chosen ? chosen.patterns() : '404'
                }));
                return true;
            });

            var matched = false;
            handlers.forEach(function(handler) {
                if( !matched ) {
                    if( handler.match(req.url ) ) {
                        matched = true;
                        chosen = handler;
                        handler.run(req,res);
                    }
                }
            });

            if( !matched ) {
                serve404(req,res);
            }
        });
        scope.server.listen(port);

    };
    scope.registerHandler = function(pattern, handler) {
        scope.addHandler(new Handler(pattern, handler));
    };
    scope.addHandler = function (handler) {
        handlers.push(handler);
    };
    scope.registerDev = function(basePath) {
        var dev = require('./lib/dev');
        dev.setBasePath(basePath);
        dev.register(scope);
    }
})(exports)