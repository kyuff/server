#!/usr/bin/env node

var Handler = require('./lib/handler.js').Handler;
var stuff = 'taget fra test.js';

function doodle () {
    console.log('other stuff');
}
var h1 = new Handler(new RegExp('abc'), function () {
    console.log(stuff);
});

if( h1.match('myabcstuff') ) {
    h1.run();
}