var lib = require('../lib/handler.js');
var Handler = lib.Handler;


function fn() {

}
describe('Handlers', function () {
    it('initialize with a failure', function () {
        expect(function () {
            var h = new Handler();
        }).toThrow(new Error(lib.ERROR_FIRST_ARGUMENT));
        expect(function () {
            var h = new Handler(fn);
        }).toThrow(new Error(lib.ERROR_SECOND_ARGUMENT));
        expect(function () {
            var h = new Handler(fn, 'abc', new RegExp('bcd'), {});
        }).toThrow(new Error(lib.ERROR_SECOND_ARGUMENT));

    })
    it('initialize correctly', function() {
        expect(function () {
            var handler = new Handler(fn, 'abc');
            handler = new Handler(fn, 'abc', 'bcd');
            handler = new Handler(fn, 'abc', 'bcd', 'cde');
            handler = new Handler(fn, new RegExp('abc'));
            handler = new Handler(fn, new RegExp('abc'), new RegExp('bcd'));
            handler = new Handler(fn, new RegExp('abc'), new RegExp('bcd'),  new RegExp('cde'));
            throw new Error('No Error thrown!');
        }).toThrow(new Error('No Error thrown!'));
    });
    it('correctly match', function() {
        var handler = new Handler(fn, 'abc');
        expect( handler.match('abc')).toBeTruthy();
        expect( handler.match('bcd')).toBeFalsy();
    });
    it('execute handler functions', function() {
        var storedArg1, storedArg2;
        var handler = new Handler(function(passedArg1, passedArg2) {
            storedArg1 = passedArg1;
            storedArg2 = passedArg2;
        }, 'abc');

        handler.run(5, 7);
        expect(storedArg1).toBe(5);
        expect(storedArg2).toBe(7);
    });
});
