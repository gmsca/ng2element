import { SchematicsException, Tree } from '@angular-devkit/schematics';
import {
  insertImport,
  addEntryComponentToModule,
  getFirstNgModuleName,
  getDecoratorMetadata
} from 'schematics-utilities/dist/angular/ast-utils';
import {
  InsertChange,
  ReplaceChange
} from 'schematics-utilities/dist/angular/change';
import { getSourceFile } from 'schematics-utilities/dist/material/ast';
import { readIntoSourceFile } from 'schematics-utilities/dist/material/build-component';
import { tsquery } from '@phenomnomnominal/tsquery';
import * as ts from 'typescript';
import { load } from 'cheerio';

export function insertImportOnly(
  host: Tree,
  modulePath: string,
  moduleName: string,
  src: string
) {
  const moduleSource = getSourceFile(host, modulePath);

  if (!moduleSource) {
    throw new SchematicsException(`Module not found: ${modulePath}`);
  }

  const change = insertImport(moduleSource, modulePath, moduleName, src);
  const recorder = host.beginUpdate(modulePath);

  if (change instanceof InsertChange) {
    recorder.insertLeft(change.pos, change.toAdd);
  }

  host.commitUpdate(recorder);
}

export function insertImportWithoutFrom(
  host: Tree,
  filePath: string,
  src: string
) {
  const recorder = host.beginUpdate(filePath);
  const fileSource = getSourceFile(host, filePath);
  if (!fileSource) {
    throw new SchematicsException(`Module not found: ${filePath}`);
  }

  let importNode = tsquery(
    fileSource,
    `ImportDeclaration:has(StringLiteral[value='${src}'])`
  );

  if (importNode.length == 0) {
    let end = fileSource.end;
    let change = new InsertChange(filePath, end - 1, `\rimport '${src}';`);
    if (change instanceof InsertChange) {
      recorder.insertLeft(change.pos, change.toAdd);
    }
    host.commitUpdate(recorder);
  }
}

export function insertEncapsulation(
  host: Tree,
  ComponentPath: string,
  encapsulationValue: string
) {
  const recorder = host.beginUpdate(ComponentPath);

  if (
    tsquery(
      readIntoSourceFile(host, ComponentPath),
      'Identifier[name="encapsulation"]'
    ).length == 0
  ) {
    let insertPos =
      getDecoratorMetadata(
        readIntoSourceFile(host, ComponentPath),
        'Component',
        '@angular/core'
      )[0].end - 1;

    let change = new InsertChange(
      ComponentPath,
      insertPos,
      `,\r\n\tencapsulation: ${encapsulationValue}`
    );

    if (change instanceof InsertChange) {
      recorder.insertLeft(change.pos, change.toAdd);
    }

    host.commitUpdate(recorder);
  }
}

export function insertStringToProviders(
  host: Tree,
  modulePath: string,
  _strInsert: string
) {
  const recorder = host.beginUpdate(modulePath);

  const appBaseHrefNode = tsquery(
    readIntoSourceFile(host, modulePath),
    'PropertyAssignment:has(Identifier[name="providers"]):has(Identifier[name="APP_BASE_HREF"])'
  );

  if (appBaseHrefNode.length == 0) {
    let providersNode: ts.Node = tsquery(
      readIntoSourceFile(host, modulePath),
      'PropertyAssignment:has(Identifier[name="providers"]) > ArrayLiteralExpression'
    )[0];
    let strContent = providersNode.getText().replace(/\s/g, '');
    let strInsert = '';

    if (strContent.length <= 2) {
      strInsert = _strInsert;
    } else {
      strInsert = `, ${_strInsert}`;
    }

    let change = new InsertChange(modulePath, providersNode.end - 1, strInsert);

    if (change instanceof InsertChange) {
      recorder.insertLeft(change.pos, change.toAdd);
    }

    host.commitUpdate(recorder);
  }
}

export function replaceBootstrapToEntryComponents(
  host: Tree,
  modulePath: string,
  strReplaceString: string
) {
  const recorder = host.beginUpdate(modulePath);

  let bootstrapNode: ts.Node[] = tsquery(
    readIntoSourceFile(host, modulePath),
    'Identifier[name="bootstrap"]'
  );
  if (bootstrapNode.length != 0) {
    let change = new ReplaceChange(
      modulePath,
      bootstrapNode[0].getStart(),
      bootstrapNode[0].getText(),
      strReplaceString
    );

    if (change instanceof ReplaceChange) {
      recorder.remove(
        bootstrapNode[0].getStart(),
        bootstrapNode[0].getText().length
      );
      recorder.insertLeft(bootstrapNode[0].getStart(), strReplaceString);
    }

    host.commitUpdate(recorder);
  }
}

export function addEntryComponents(host: Tree, modulePath: string) {
  const source = readIntoSourceFile(host, modulePath);

  const recorder = host.beginUpdate(modulePath);
  const changes = addEntryComponentToModule(
    source,
    modulePath,
    'AppComponent',
    './app.component'
  );
  for (const change of changes) {
    if (change instanceof InsertChange) {
      recorder.insertLeft(change.pos, change.toAdd);
    }
  }
  host.commitUpdate(recorder);
}

export function modifyIndexHTML(
  host: Tree,
  fileName: string,
  oldElementName: string,
  newElementName: string
) {
  const fileContent: Buffer | null = host.read(fileName);
  if (fileContent) {
    const $ = load(fileContent, { decodeEntities: true });
    $('head > base').remove();
    $('head').append(`<script src="polyfill.min.js"></script>
    <script src="custom-elements-es5-adapter.js"></script>
    <script src="webcomponents-bundle.js"></script>
    <script src="zone.min.js"></script>`);

    if ($(`${newElementName}-element`).length == 0) {
      if ($(`${oldElementName}`).length > 0) {
        let content = $(`app-root`).html();

        $(`app-root`).replaceWith(
          `<${newElementName}-element>${content}</${newElementName}-element>`
        );
      } else {
        $('body').append(
          `<${newElementName}-element></${newElementName}-element>`
        );
      }
      $('body').append(`<script src="${newElementName}-element.js"></script>`);
      host.overwrite(fileName, $.html());
    }
  }
}

export function modifyAppComponentHTML(
  host: Tree,
  fileName: string,
  tagName: string,
  attrNameValue: string
): boolean {
  let hasRouter = false;
  const fileContent: Buffer | null = host.read(fileName);

  if (fileContent) {
    const $ = load(fileContent);

    if ($(tagName).length) {
      if (
        $(tagName).attr('name') === null ||
        $(tagName).attr('name') === undefined
      ) {
        $(tagName).attr('name', attrNameValue);
        const content = $('body').html() ? $('body').html() : '';
        host.overwrite(fileName, content ? content : '');
        hasRouter = true;
      }
    }
  }

  return hasRouter;
}

export function insertConstructorToClass(host: Tree, modulePath: string) {
  const recorder = host.beginUpdate(modulePath);
  const source = readIntoSourceFile(host, modulePath);
  const strClassName = getFirstNgModuleName(source);

  const ConstructorNode = tsquery(
    readIntoSourceFile(host, modulePath),
    `ClassDeclaration:has(Identifier[name=${strClassName}]):has(Constructor)`
  );

  if (ConstructorNode.length == 0) {
    let classNode = tsquery(
      readIntoSourceFile(host, modulePath),
      `ClassDeclaration:has(Identifier[name=${strClassName}])`
    )[0];

    let strInsert = '\r\n\tconstructor(private injector: Injector) {}\r\n';

    let change = new InsertChange(modulePath, classNode.end - 1, strInsert);

    if (change instanceof InsertChange) {
      recorder.insertLeft(change.pos, change.toAdd);
    }

    host.commitUpdate(recorder);
  } else {
    let parameterInjectorNode = tsquery(
      readIntoSourceFile(host, modulePath),
      `ClassDeclaration:has(Identifier[name=${strClassName}]) > Constructor > Parameter:has(Identifier[name=Injector])`
    );
    let parameterNodes = tsquery(
      readIntoSourceFile(host, modulePath),
      `ClassDeclaration:has(Identifier[name=${strClassName}]) > Constructor > Parameter`
    );
    let constructorNode = tsquery(
      readIntoSourceFile(host, modulePath),
      `ClassDeclaration:has(Identifier[name=${strClassName}]) > Constructor`
    );

    let strInsert = 'private injector: Injector';
    if (parameterNodes.length == 0) {
      let pos =
        constructorNode[0].pos + constructorNode[0].getFullText().indexOf('(');

      let change = new InsertChange(modulePath, pos + 1, strInsert);

      if (change instanceof InsertChange) {
        recorder.insertLeft(change.pos, change.toAdd);
      }

      host.commitUpdate(recorder);
    } else {
      if (parameterInjectorNode.length == 0) {
        let pos =
          constructorNode[0].pos +
          constructorNode[0].getFullText().indexOf('(');

        let change = new InsertChange(modulePath, pos + 1, strInsert + ', ');

        if (change instanceof InsertChange) {
          recorder.insertLeft(change.pos, change.toAdd);
        }

        host.commitUpdate(recorder);
      }
    }
  }
}

export function insertNgDoBootstrap(
  host: Tree,
  modulePath: string,
  _addContent: string
) {
  const recorder = host.beginUpdate(modulePath);
  const source = readIntoSourceFile(host, modulePath);
  const strClassName = getFirstNgModuleName(source);

  let classNodes = tsquery(
    readIntoSourceFile(host, modulePath),
    `ClassDeclaration:has(Identifier[name=${strClassName}])`
  );

  let ngDoBootstrapNode = tsquery(
    readIntoSourceFile(host, modulePath),
    `ClassDeclaration:has(Identifier[name=${strClassName}]) > MethodDeclaration:has(Identifier[name=ngDoBootstrap])`
  );

  if (ngDoBootstrapNode.length == 0) {
    const text = `
    ngDoBootstrap() {
      ${_addContent}
    }
    `;
    let change = new InsertChange(modulePath, classNodes[0].end - 1, text);

    if (change instanceof InsertChange) {
      recorder.insertLeft(change.pos, change.toAdd);
    }
    host.commitUpdate(recorder);
  } else {
    let blockNode = tsquery(
      readIntoSourceFile(host, modulePath),
      `ClassDeclaration:has(Identifier[name=${strClassName}]) > MethodDeclaration:has(Identifier[name=ngDoBootstrap]) > Block:has(Identifier[name=customElements])`
    );

    if (blockNode.length == 0) {
      let emptyBlockNode = tsquery(
        readIntoSourceFile(host, modulePath),
        `ClassDeclaration:has(Identifier[name=${strClassName}]) > MethodDeclaration:has(Identifier[name=ngDoBootstrap]) > Block`
      );

      let change = new InsertChange(
        modulePath,
        emptyBlockNode[0].end - 1,
        _addContent
      );

      if (change instanceof InsertChange) {
        recorder.insertLeft(change.pos, change.toAdd);
      }
      host.commitUpdate(recorder);
    }
  }
}
