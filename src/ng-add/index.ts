import {
  apply,
  chain,
  MergeStrategy,
  mergeWith,
  move,
  noop,
  renameTemplateFiles,
  Rule,
  SchematicContext,
  SchematicsException,
  template,
  Tree,
  url
} from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { getWorkspace } from 'schematics-utilities/dist/angular/config';
import {
  addPackageJsonDependency,
  getPackageJsonDependency
} from 'schematics-utilities/dist/angular/dependencies';
import { getAppModulePath } from 'schematics-utilities/dist/angular/ng-ast-utils';
import { getIndexHtmlPath } from 'schematics-utilities/dist/material/ast';
import { getProjectFromWorkspace } from 'schematics-utilities/dist/material/get-project';
import { Schema } from './schema';
import {
  addEntryComponents,
  insertConstructorToClass,
  insertEncapsulation,
  insertImportOnly,
  insertNgDoBootstrap,
  insertStringToProviders,
  modifyIndexHTML,
  replaceBootstrapToEntryComponents
} from './utility/ast-utils';
import { dependencies } from './versions';

export function ngAdd(_options: Schema): Rule {
  return chain([
    _options && _options.skipPackageJson
      ? noop()
      : addPackageJsonDependencies(),
    _options && _options.skipPackageJson
      ? noop()
      : installPackageJsonDependencies(),
    editAppComponent(_options),
    editAppModuleDotTs(_options),
    createBundleScript(_options),
    addNPMScripts(),
    editIndexHtml(_options)
  ]);
}

function addPackageJsonDependencies(): Rule {
  return (host: Tree, context: SchematicContext) => {
    dependencies.forEach(dependency => {
      addPackageJsonDependency(host, dependency);
      context.logger.log(
        'info',
        `✔️        Added "${dependency.name}" into ${dependency.type}`
      );
    });

    return host;
  };
}

function installPackageJsonDependencies(): Rule {
  return (host: Tree, context: SchematicContext) => {
    context.addTask(new NodePackageInstallTask());
    context.logger.log(
      'info',
      `◽◽◽◽◽◽ Installing packages... ◽◽◽◽◽◽`
    );

    return host;
  };
}

function editAppComponent(_options: Schema): Rule {
  return (host: Tree, context: SchematicContext) => {
    const workspace = getWorkspace(host);
    const project = getProjectFromWorkspace(
      workspace,
      _options.project
        ? _options.project
        : Object.keys(workspace['projects'])[0]
    );

    const appComponentTsPath = `${project.sourceRoot}/app/app.component.ts`;

    insertImportOnly(
      host,
      appComponentTsPath,
      'ViewEncapsulation',
      '@angular/core'
    );

    insertEncapsulation(
      host,
      appComponentTsPath,
      'ViewEncapsulation.ShadowDom'
    );

    context.logger.log('info', `✔️        app.component.ts is modified`);

    return host;
  };
}

function editAppModuleDotTs(_options: Schema): Rule {
  return (host: Tree, context: SchematicContext) => {
    const workspace = getWorkspace(host);
    const project = getProjectFromWorkspace(
      workspace,
      _options.project
        ? _options.project
        : Object.keys(workspace['projects'])[0]
    );

    const elementName = Object.keys(workspace['projects'])[0];

    const targets = (<any>project).targets || project.architect;
    const modulePath = getAppModulePath(host, targets.build.options.main);

    insertImportOnly(host, modulePath, 'Injector', '@angular/core');
    context.logger.log(
      'info',
      `✔️        Injector is imported in src/app/app.module.ts`
    );
    insertImportOnly(host, modulePath, 'APP_BASE_HREF', '@angular/common');
    context.logger.log(
      'info',
      `✔️        APP_BASE_HREF is imported in src/app/app.module.ts`
    );
    insertImportOnly(
      host,
      modulePath,
      'createCustomElement',
      '@angular/elements'
    );
    context.logger.log(
      'info',
      `✔️        createCustomElement is imported in src/app/app.module.ts`
    );
    insertStringToProviders(
      host,
      modulePath,
      "{ provide: APP_BASE_HREF, useValue: '/' }"
    );
    context.logger.log(
      'info',
      `✔️        { provide: APP_BASE_HREF, useValue: '/' } is imported in src/app/app.module.ts`
    );
    replaceBootstrapToEntryComponents(host, modulePath, 'entryComponents');
    context.logger.log(
      'info',
      `✔️        replace bootstrap to entrycomponents in src/app/app.module.ts`
    );
    addEntryComponents(host, modulePath);
    context.logger.log(
      'info',
      `✔️        add EntryComponents in src/app/app.module.ts`
    );
    insertConstructorToClass(host, modulePath);
    context.logger.log(
      'info',
      `✔️        insert Constructor in src/app/app.module.ts`
    );
    const addContent = `  
    const el = createCustomElement(AppComponent, {
      injector: this.injector
    });
    customElements.define('${elementName}-element', el);
  `;
    insertNgDoBootstrap(host, modulePath, addContent);
    context.logger.log(
      'info',
      `✔️        insert code to NgDoBootstrap in src/app/app.module.ts`
    );
    context.logger.log(
      'info',
      `✔️        Injector APP_BASE_HREF createCustomElement is imported in src/app/app.module.ts`
    );

    return host;
  };
}

function createBundleScript(_options: Schema) {
  return (host: Tree, context: SchematicContext) => {
    const workspace = getWorkspace(host);
    const project = getProjectFromWorkspace(
      workspace,
      _options.project
        ? _options.project
        : Object.keys(workspace['projects'])[0]
    );

    const sourceTemplate = url('./files');
    const ngCore = getPackageJsonDependency(host, `@angular/core`);
    if (ngCore) {
      let tempArr = ngCore.version.match(/[0-9]+/);
      if (tempArr) {
        _options.ngVersion = Number(tempArr[0]);
      }
    }

    _options.projectRoot = project.root.trim()
      ? project.root.trim()
      : Object.keys(workspace.projects)[0];
    _options.projectSourceRoot = project.sourceRoot;
    _options.project = Object.keys(workspace.projects)[0];

    const sourceParametrizeTemplate = apply(sourceTemplate, [
      renameTemplateFiles(),
      template({ ..._options }),
      move('/')
    ]);

    host = mergeWith(sourceParametrizeTemplate, MergeStrategy.Overwrite)(
      host,
      context
    ) as Tree;

    context.logger.log('info', `✔️        CreateBundleScript running`);
    return host;
  };
}

function addNPMScripts() {
  return (host: Tree, context: SchematicContext) => {
    const strPkgPath = '/package.json';
    const bufPkgContent: Buffer | null = host.read(strPkgPath);

    if (bufPkgContent === null) {
      throw new SchematicsException('Could not find package.json');
    }

    const strPkgContent = JSON.parse(bufPkgContent.toString());

    if (bufPkgContent.toString().indexOf('build:ngelement') == -1) {
      strPkgContent.scripts[
        'build:ngelement'
      ] = `ng build --prod --output-hashing none && ts-node -P ./tasks/tsconfig.tasks.json tasks/build-elements.ts`;
      context.logger.log('info', `✔️        addBundleScript running`);
    }

    host.overwrite(strPkgPath, JSON.stringify(strPkgContent, null, 2));
    return host;
  };
}

function editIndexHtml(_options: Schema) {
  return (host: Tree, context: SchematicContext) => {
    const workspace = getWorkspace(host);
    const elementName = Object.keys(workspace.projects)[0];
    const project = getProjectFromWorkspace(
      workspace,
      _options.project
        ? _options.project
        : Object.keys(workspace['projects'])[0]
    );

    const fileName = getIndexHtmlPath(project);
    try {
      modifyIndexHTML(host, fileName, 'app-root', elementName);
    } catch (e) {
      context.logger.log(
        'error',
        `🐛  Failed to modify the <app-root> in ${fileName}`
      );
    }

    context.logger.log('info', `✔️        modified "${fileName}" `);
    return host;
  };
}
