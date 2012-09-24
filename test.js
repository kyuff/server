#!/usr/bin/env node

var server = require('./server');

server.serve('./web', 8080);