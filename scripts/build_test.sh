#!/bin/bash
node test/generate.js
cross-env POLYFILL=true webpack --config test/webpack.config.js