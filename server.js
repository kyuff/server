(function (scope) {
    scope.LOG_FORMAT = "{{timestamp}} - {{method}} {{status}} {{&url}}";
    var fs = require("fs"),
        http = require('http'),
        util = require('util'),
        path = require('path'),
        mustache = require('mustache'),
        sass = require('./lib/sass'),
        mime = require('mime'),
        indexer = require('./lib/indexer');

    function sendResponse(res, status, mimeType, msg) {
        res.writeHead(status, {'Content-Type':mimeType});
        res.end("" + msg);
    }

    function registerLogging(req, res) {
        req.on('end', function () {
            console.log(mustache.to_html(scope.LOG_FORMAT, {
                method:req.method,
                url:req.url,
                status:res.statusCode,
                timestamp:new Date().toISOString()
            }));
            return true;
        });
    }

    function staticFiles(req, res) {
        var file = this.basePath + req.url;
        fs.readFile(file, 'UTF-8', function (err, data) {
            if (err) {
                sendResponse(res, 404, 'text/plain', "Couldn't find " + req.url + "\nError: " + err);
            } else {
                sendResponse(res, 200, mime.lookup(file), data);
            }
        })
    }

    function scssTemplate(req, res) {
        var files = indexer.indexFiles(this.basePath);
        var libs = [];
        for (var i = 0; i < files['scss'].length; i++) {
            var file = files['scss'][i];
            libs.push(path.dirname(file));
        }
        sass.render(this.basePath + req.url, libs, function (err, css) {
            if (err) {
                sendResponse(res, 500, 'text/plain', err);
            } else {
                sendResponse(res, 200, 'text/css', css);
            }
        });
    }

    function sendIndexFile(req, res) {
        var files = indexer.indexFiles(this.basePath);
        var model = {
            js:indexer.replaceList(this.basePath, '', files['js']),
            css:indexer.replaceList(this.basePath, '', files['scss'])
        };

        fs.readFile(this.basePath + '/index.html', 'UTF-8', function (err, data) {
            if (err) {
                sendResponse(res, 500, 'text/plain', err);
            } else {
                var html = mustache.to_html(data, model);
                sendResponse(res, 200, 'text/html; charset=UTF-8', html);
            }
        });
    }

    function isStaticFile(url) {
        var matched = false;
        ['/libs', '/js', '/app', '/img'].forEach(function (item) {
            matched = url.indexOf(item) == 0 ? true : matched;
        });
        if (matched) {
            matched =  !isScssFile(url);
        }
        return matched;
    }

    function isScssFile(url) {
        return url.match(".*\.scss$");
    }

    scope.DevServer = function (port, basePath) {
        this.basePath = path.resolve(basePath);
        var dev = this;
        this.server = http.createServer(function (req, res) {
            registerLogging(req, res);
            if (isStaticFile(req.url)) {
                staticFiles.call(dev,req, res);
            } else if (isScssFile(req.url)) {
                scssTemplate.call(dev,req, res);
            } else {
                sendIndexFile.call(dev, req, res);
            }
        });
        this.server.listen(port);
    };

})(exports)