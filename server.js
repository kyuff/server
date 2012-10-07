(function(scope) {
    scope.LOG_FORMAT = "{{timestamp}} - {{method}} {{status}} {{&url}}";
    var fs = require("fs");
    var http = require('http');
    var util = require('util');
    var path = require('path');
    var mustache = require('mustache');
    var mime = require('mime');
    var sass = require('./lib/sass');
    var indexer = require('./lib/indexer');
    var Handler = require('./lib/handler.js').Handler;

    var handlers = [];

    function redirectToHtml(req, res) {
        req.url = req.url + "index.html";
        mustacheTemplate(req,res);
    }
    function scssTemplate(req, res) {
        var files = indexer.indexFiles(scope.basePath);
        var libs = [];
        for(var i=0; i<files['scss'].length; i++) {
            var file = files['scss'][i];
            libs.push( path.dirname(file));
        }
        sass.render(scope.basePath + result.url, libs, function(err, css) {
            if (err) {
                res.writeHead(500, {'Content-Type': 'text/plain'});
                res.end(""+err);
            } else {
                res.writeHead(200, {'Content-Type': 'text/css'});
                res.end(data);
            }
            done(result);
        });
    }
    function mustacheTemplate(req, res) {
        var files = indexer.indexFiles(scope.basePath);
        var model = {
            js : indexer.replaceList(scope.basePath, '', files['js']),
            css : indexer.replaceList(scope.basePath, '', files['scss'])
        };
        var data = fs.readFileSync(scope.basePath + req.url, 'UTF-8');
        res.writeHead(200, {'Content-Type':'text/html; charset=UTF-8'});
        res.end(mustache.to_html(data, model));
    }
    function staticFiles(req, res) {
        var path = scope.basePath + req.url;
        fs.readFile(path, 'UTF-8', function(err, data){
            if( err ) {
                res.writeHead(404, {'Content-Type':'text/plain'});
                var msg = 'Could not find ' + req.url + "\nError; " + err;
                res.end(msg);
            } else {
                res.writeHead(200, {'Content-Type':mime.lookup(path)});
                res.end(data);
            }
        });
    }
    function handleRequest(req, res) {
        var matched = false;
        handlers.forEach(function(handler) {
            if( !matched ) {
                if( handler.match(req.url ) ) {
                    matched = true;
                    handler.run(req,res);
                }
            }
        });

        if( !matched ) {
            staticFiles(req,res);
        }
    }

    scope.serve = function (basePath, port) {
        scope.basePath = path.resolve(basePath);
        console.log("Working in " + scope.basePath);
        scope.server = http.createServer( function(req, res) {
            req.on('end', function() {
                console.log(mustache.to_html(scope.LOG_FORMAT, {
                    method : req.method,
                    url : req.url,
                    status : res.statusCode,
                    timestamp : new Date().toISOString()
                }));
                return true;
            });
            handleRequest(req,res);
        });
        scope.server.listen(port);

    };
    scope.defaultHandlers = function() {
        handlers.push(
            new Handler('.*html', mustacheTemplate),
            new Handler('.*/$', redirectToHtml)
        );
    };
    scope.registerHandler = function(pattern, handler) {
        handlers[pattern] = handler;
    };
})(exports)