import {
  NodeDependency,
  NodeDependencyType,
} from 'schematics-utilities/dist/angular';

const angularElementsVersion = '^9.1.0';
const webcomponentsjsVersion = '^2.4.3';
const babelPolyfillVersion = '^7.8.7';
const fsVersion = '^8.1.0';
const typeFsVersion = '^8.1.0';
const replaceInFileVersion = '^5.0.2';

export const dependencies: NodeDependency[] = [
  {
    type: NodeDependencyType.Default,
    version: angularElementsVersion,
    name: '@angular/elements',
  },
  {
    type: NodeDependencyType.Default,
    version: webcomponentsjsVersion,
    name: '@webcomponents/webcomponentsjs',
  },
  {
    type: NodeDependencyType.Dev,
    version: typeFsVersion,
    name: '@types/fs-extra',
  },
  {
    type: NodeDependencyType.Dev,
    version: fsVersion,
    name: 'fs-extra',
  },
  {
    type: NodeDependencyType.Dev,
    version: replaceInFileVersion,
    name: 'replace-in-file',
  },
  {
    type: NodeDependencyType.Dev,
    version: babelPolyfillVersion,
    name: '@babel/polyfill',
  },
];
