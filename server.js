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
                sendResponse(res,500,'text/plain', err);
            } else {
                sendResponse(res,200, 'text/css', data);
            }
            done(result);
        });
    }
    function sendResponse(res, status, mimeType, msg) {
        res.writeHead(status, {'Content-Type': mimeType});
        res.end(msg);
    }
    function mustacheTemplate(req, res) {
        var files = indexer.indexFiles(scope.basePath);
        var model = {
            js : indexer.replaceList(scope.basePath, '', files['js']),
            css : indexer.replaceList(scope.basePath, '', files['scss'])
        };
        fs.readFile(scope.basePath + req.url, 'UTF-8', function(err, data) {
            if( err ) { 
                sendResponse(res, 500,'text/plain', err);
            } else {
                sendResponse(res, 200, 'text/html; charset=UTF-8',mustache.to_html(data, model));
            }
        });
        var data = fs.readFileSync(scope.basePath + req.url, 'UTF-8');

    }
    function staticFiles(req, res) {
        var path = scope.basePath + req.url;
        fs.readFile(path, 'UTF-8', function(err, data){
            if( err ) {
                sendResponse( res, 404, 'text/plain', "Cout find " + req.url +"\nError: " + err);
            } else {
                sendResponse(res, 200, mime.lookup(path), data);
            }
        });
    }
    function serve404(req, res) {
        res.writeHead(404, {'Content-Type': 'text/plain'});
        var msg404 = ""+req.url + " findes ikke";
        res.end(msg404);
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
            serve404(req,res);
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
        scope.addHandler(new Handler(pattern, handler));
    };
    scope.addHandler = function (handler) {
        handlers.push(handler);
    };
    scope.handleMustache = function() { scope.addHandler(new Handler('.*.html', mustacheTemplate)); };
    scope.handleScss     = function() { scope.addHandler(new Handler('.*.scss', scssTemplate)); };

})(exports)