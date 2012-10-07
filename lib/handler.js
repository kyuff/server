(function (scope) {
    function Handler(pattern, handler) {
        if( typeof pattern === 'string' ) {
            this.re = new RegExp(pattern);
        } else if (pattern instanceof RegExp) {
            this.re = pattern;
        } else {
            throw new Error("First argument to Handler must be either a string or RegExp");
        }

        if(typeof handler !== 'function') {
            throw new Error("Second argument to Handler must be a function");
        }
        this.getPattern = function () {
            return pattern;
        };
        this.run = function() {
            handler.apply(this, arguments);
        };
        this.match = function(url) {
            return this.re.test(url)
        };
    }
    scope.Handler = Handler;
})(exports);