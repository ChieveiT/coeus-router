#!/bin/bash
mocha test/routes-loader.spec.js --compilers js:babel-register

mocha-phantomjs test/build/routes.html
