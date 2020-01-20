import { terser } from 'rollup-plugin-terser';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import resolve from 'rollup-plugin-node-resolve';
import builtins from 'rollup-plugin-node-builtins';
import copy from 'rollup-plugin-copy';
import typescript from 'rollup-plugin-typescript';

const production = true;
export default {
  input: 'src/ng-add/index.ts',
  output: {
    file: 'dist/ng-add/index.js',
    format: 'cjs', // immediately-invoked function expression — suitable for <script> tags
    sourcemap: false,
    exports: 'named'
  },
  external: [
    '@angular-devkit/core',
    '@angular-devkit/schematics',
    '@angular-devkit/schematics/tasks',
    '@schematics/angular/utility/config',
    '@schematics/angular/utility/ng-ast-utils',
    '@schematics/angular/utility/dependencies',
    '@schematics/angular/utility/ast-utils',
    '@schematics/angular/utility/change',
    '@phenomnomnominal/tsquery',
    '@schematics/angular',
    '@types/cheerio',
    '@types/jasmine',
    '@types/node',
    'cheerio',
    'jasmine',
    'typescript'
  ],
  plugins: [
    resolve({
      only: ['schematics-utilities'],
      preferBuiltins: true
    }),
    commonjs(),
    builtins(),
    typescript(),
    json(),
    copy({
      targets: [
        { src: 'src/ng-add/files/**/*.template', dest: 'dist/ng-add/files/' },
        { src: 'src/collection.json', dest: 'dist' },
        { src: 'package.json', dest: 'dist' },
        { src: 'README.md', dest: 'dist' }
      ]
    }),
    production && terser()
  ]
};
