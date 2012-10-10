(function (scope) {
    scope.ERROR_FIRST_ARGUMENT  = "First argument to Handler must be a handler function";
    scope.ERROR_SECOND_ARGUMENT = 'Second and following argument must be strings or RegExp objects';
    function Handler(handler) {
        var matchers = [];
        if(typeof handler !== 'function') {
            throw new Error(scope.ERROR_FIRST_ARGUMENT);
        }
        if( arguments.length < 2 ) {
            throw new Error(scope.ERROR_SECOND_ARGUMENT);
        }

        for(var i=1;i<arguments.length;i++) {
            var re = arguments[i];
            if(typeof re === 'string') {
                matchers.push(new RegExp(re));
            } else if (re instanceof RegExp) {
                matchers.push(re);
            } else {
                throw new Error(scope.ERROR_SECOND_ARGUMENT);
            }
        }

        this.patterns = function() {
            return matchers;
        }
        this.run = function() {
            handler.apply(this, arguments);
        };
        this.match = function(url) {
            var matched = false;
            matchers.forEach(function(re) {
                matched = re.test(url) ? true : matched;
            });
            return matched;
        };
    }
    scope.Handler = Handler;
})(exports);