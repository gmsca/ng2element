const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: './src/ng-add/index.js',
  output: {
    path: path.resolve(__dirname, './dist/ng-add'),
    filename: 'index.js',
    libraryTarget: 'commonjs2'
  },
  mode: 'production',
  target: 'node',
  externals: [
    nodeExternals({
      whitelist: [
        'schematics-utilities/dist/angular/ast-utils',
        'schematics-utilities/dist/angular/change',
        'schematics-utilities/dist/angular/config',
        'schematics-utilities/dist/angular/dependencies',
        'schematics-utilities/dist/angular/ng-ast-utils',
        'schematics-utilities/dist/material/ast',
        'schematics-utilities/dist/material/get-project',
        'schematics-utilities/dist/material/build-component',
        'npm-registry-client'
      ]
    })
  ]
};
