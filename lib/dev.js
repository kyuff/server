(function (scope) {
    var mime = require('mime'),
        sass = require('./sass'),
        fs = require("fs"),
        path = require('path'),
        Handler = require('./handler').Handler,
        indexer = require('./indexer'),
        mustache = require('mustache');

    function sendResponse(res, status, mimeType, msg) {
        res.writeHead(status, {'Content-Type':mimeType});
        res.end(""+msg);
    }

    scope.setBasePath = function (basePath) {
        scope.basePath = path.resolve(basePath);
    }

    scope.StaticFileHandler = new Handler(function staticFiles(req, res) {
        var file = scope.basePath + req.url;
        fs.readFile(file, 'UTF-8', function (err, data) {
            if (err) {
                sendResponse(res, 404, 'text/plain', "Couldn't find " + req.url + "\nError: " + err);
            } else {
                sendResponse(res, 200, mime.lookup(file), data);
            }
        })
    }, /.*js$/, /.*\.css$/);
    scope.ScssHandler = new Handler(function scssTemplate(req, res) {
        var files = indexer.indexFiles(scope.basePath);
        var libs = [];
        for (var i = 0; i < files['scss'].length; i++) {
            var file = files['scss'][i];
            libs.push(path.dirname(file));
        }
        sass.render(scope.basePath + req.url, libs, function (err, css) {
            if (err) {
                sendResponse(res, 500, 'text/plain', err);
            } else {
                sendResponse(res, 200, 'text/css', css);
            }
        });
    }, ".*\.scss");
    scope.MustacheHandler = new Handler(function mustacheTemplate(req, res) {
        var files = indexer.indexFiles(scope.basePath);
        var model = {
            js:indexer.replaceList(scope.basePath, '', files['js']),
            css:indexer.replaceList(scope.basePath, '', files['scss'])
        };
        fs.readFile(scope.basePath + req.url, 'UTF-8', function (err, data) {
            if (err) {
                sendResponse(res, 500, 'text/plain', err);
            } else {
                sendResponse(res, 200, 'text/html; charset=UTF-8', mustache.to_html(data, model));
            }
        });
        var data = fs.readFileSync(scope.basePath + req.url, 'UTF-8');

    }, ".*html$");
    scope.RedirectToHtml = new Handler(function redirectToHtml(req, res) {
        req.url = req.url + "index.html";
        scope.MustacheHandler.run(req,res);
    }, ".*/$");

    scope.register = function(server) {
        if( typeof server.addHandler === 'function') {
            server.addHandler(scope.MustacheHandler);
            server.addHandler(scope.StaticFileHandler);
            server.addHandler(scope.RedirectToHtml);
            server.addHandler(scope.ScssHandler);
        }
    };
})(exports);