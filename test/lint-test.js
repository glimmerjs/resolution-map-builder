const lint = require('mocha-eslint');

const paths = [
  'lib/**/*.js',
  'test/**/*.js'
];

lint(paths);
