const path = require('path');
const nodeExternals = require('webpack-node-externals');
const CopyWebpackPlugin = require('copy-webpack-plugin');

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
        'schematics-utilities/dist/material/ast',
        'schematics-utilities/dist/material/get-project',
        'schematics-utilities/dist/material/build-component',
        'npm-registry-client'
      ]
    })
  ],
  plugins: [
    new CopyWebpackPlugin(
      [
        {
          from: './src/collection.json',
          to: '../collection.json',
          toType: 'file'
        },
        {
          from: './package.json',
          to: '../package.json',
          toType: 'file'
        },
        {
          from: './src/ng-add/files/',
          to: './files/[name].[ext]',
          test: /([^/]+)\/(.+)\.template$/,
          toType: 'template'
        },
        {
          from: './README.md',
          to: '../README.md',
          toType: 'file'
        }
      ],
      {}
    )
  ]
};
