(function(scope) {
    scope.LOG_FORMAT = "{{timestamp}} - {{method}} {{status}} [{{&mime}}] {{&url}}";
    var fs = require("fs");
    var http = require('http');
    var util = require('util');
    var path = require('path');
    var mustache = require('mustache');
    var mime = require('mime');
    var sass = require('./lib/sass');
    //var common = require('./common');

    var handlers = {
        '\/$' : slash,
        '\.scss$' : scss
    };
    function slash(result, done) {
        result.url += 'index.html';
        html(result, done);
    }
    function default_action(result, done) {
        var path = scope.basePath + result.url;
        result.mime = mime.lookup(path);
        fs.readFile(path, 'UTF-8', function(err, data){
            if( err ) {
                result.status = 404;
               result.data = 'Could not find ' + result.url + "\nError; " + err;
                result.mime = 'text/plain';
            } else {
                result.data = data;
                result.status = 200;
            }
            done(result);
        });
    }
    function html(result, done) {
        var files = common.indexFiles(scope.basePath);
        var model = {
            js : common.replaceList(scope.basePath, '', files['js']),
            css : common.replaceList(scope.basePath, '', files['scss'])
        };
        var data = fs.readFileSync(scope.basePath + result.url, 'UTF-8');
        result.data = mustache.to_html(data, model);
        result.status = 200;
        result.mime = "text/html;charset=UTF-8";
        done(result);
    }
    function scss(result, done) {
        var files = common.indexFiles(scope.basePath);
        var libs = [];
        for(var i=0; i<files['scss'].length; i++) {
            var file = files['scss'][i];
            libs.push( path.dirname(file));
        }
        sass.render(scope.basePath + result.url, libs, function(err, css) {
            if (err) {
                result.status = 500;
                result.data = ""+err;
                result.mime = 'text/plain';
            } else {
                result.data = css;
                result.mime = 'text/css';
                result.status = 200;
            }
            done(result);
        });
    }
    function handleRequest(req, res) {
        var done = function (result) {
            console.log(mustache.to_html(scope.LOG_FORMAT, result));
            res.writeHead(result.status, {'Content-Type':result.mime});
            res.end(result.data);
        };
        var result = {
            method : req.method,
            url : req.url,
            mime : null,
            status : 'text/plain',
            timestamp : new Date().toISOString(),
            data : ""
        };
        var matched = false;
        for( var matcher in handlers ) {
            if( !matched ) {
                if(result.url.match(matcher)) {
                    matched = true;
                    handlers[matcher](result, done);
                }
            }
        }
        if( !matched ) {
            default_action(result, done);
        }
    }

    scope.serve = function (basePath, port) {
        scope.basePath = path.resolve(basePath);
        console.log("Working in " + scope.basePath);
        http.createServer(handleRequest).listen(port);
    };

    scope.registerHandler = function(pattern, handler) {
        handlers[pattern] = handler;
    };
})(exports)