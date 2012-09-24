(function(scope) {
    var exec = require('child_process').exec;
    scope.render = function(path, libs, callback) {
        var libStr = '';
        var obj = {};
        libs.forEach(function(value) {
            obj[value] = true;
        });
        for(var key in obj ) {
            libStr += '-I "'+key+'" ';
        }
        var cmd = 'sass '+ libStr + path;
        exec(cmd, function(error, stdout, stderr) {
            callback(error, stdout);
        });
    }
})(exports)
