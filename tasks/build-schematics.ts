import {
  copy,
  copyFile,
  copyFileSync,
  readJsonSync,
  writeJsonSync
} from 'fs-extra';
import replaceInFile from 'replace-in-file';

const distPackageJsonPath = 'dist/package.json';

const options = {
  files: distPackageJsonPath,
  from: /\/src\//g,
  to: '/'
};

// const filterFunc: CopyOptionsSync = {
//   filter: src => {
//     const isFolder = /\//.test(src);
//     if (isFolder) {
//       return true;
//     } else {
//       return /.template/.test(src);
//     }
//   }
// };

copyFile('src/collection.json', 'dist/collection.json');
copyFile('README.md', 'dist/README.md');
copy('src/ng-add/files/', 'dist/ng-add/files/');
copyFileSync('package.json', distPackageJsonPath);
replaceInFile.sync(options);
let pkg = readJsonSync(distPackageJsonPath);
pkg.devDependencies = {};
writeJsonSync(distPackageJsonPath, pkg);
