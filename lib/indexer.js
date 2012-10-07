(function(scope) {

    var IGNORES = [/libs/m, /\/bin\//m, /\.md$/m, /\.iml$/m ];
    var fs = require("fs");
    var path = require('path');
    var util = require('util');

    scope.replaceList = function(search,replacement, arr) {
        var result = [];
        for(var i=0; i<arr.length; i++) {
            result.push( arr[i].replace(search, replacement) );
        }
        return result;
    };
    scope.indexFiles = function indexFiles(filePath) {
        var content = {};
        filePath = path.resolve(filePath);
        function add(key, val) {
            for (var i = 0; i < IGNORES.length; i++) {
                var filter = IGNORES[i];
                if (filter.test(val)) return;
            }
            if (typeof content[key] === 'undefined') {
                content[key] = [];
            }
            if (util.isArray(val)) {
                for (var i = 0; i < val.length; i++) {
                    content[key].push(val[i]);
                }
            } else {
                content[key].push(val);
            }
        }

        var files = fs.readdirSync(filePath);
        for (var i = 0; i < files.length; i++) {
            if (!files[i].match(/^\..*/)) {
                var file = filePath + '/' + files[i];
                var stat = fs.statSync(file);
                if (stat.isDirectory()) {
                    var children = indexFiles(file);
                    for (var key in children) {
                        add(key, children[key]);
                    }
                } else {
                    var base = file.replace(scope.basePath, '');
                    var ext = path.extname(file).substr(1);
                    add(ext, base);
                }
            }
        }
        return content;
    }
})(exports)
