#!/bin/bash
mocha test/routes-loader.spec.js --compilers js:babel-register

mocha-phantomjs test/build/routes.html
mocha-phantomjs -s webSecurityEnabled=false test/build/reducerRouter.html