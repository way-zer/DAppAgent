const {Project, ModuleDeclarationKind} = require('ts-morph');
const path = require('path');

const mainDir = path.resolve(__dirname, '..');
const project = new Project({
  tsConfigFilePath: path.join(mainDir, 'tsconfig.json'),
});

const dtsFile = project.createSourceFile('./dist/services.d.ts', undefined, {overwrite: true});
const dir = project.getDirectory(path.join(mainDir, 'src', 'apis', 'services'));

const solvedImport = [];

function transformDynamicImport(text) {
  return text.toString().replaceAll(/import\("([^"]+)"\).(\w+)/g, (_, module, name) => {
    if (!solvedImport.includes(module + '@' + name)) {
      solvedImport.push(module + '@' + name);

      const source = project.getSourceFile(module + '.ts') || project.getSourceFile(module + '.d.ts') || project.getAmbientModule(module);
      const sType = source.getInterface(name);
      if (sType) {
        const structure = sType.getStructure();
        for (const p of structure.properties) {
          p.type = transformDynamicImport(sType.getPropertyOrThrow(p.name).getType().getText());
        }
        // debugger
        dtsFile.addInterface(sType.getStructure());
      } else {
        const sType = source.getTypeAlias(name);
        if (sType)
          dtsFile.addTypeAlias(sType.getStructure());
        else {
          console.warn('Not resolve dynamic import', module, name);
          dtsFile.addTypeAlias({name: name, docs: ['Not resolve'], type: '{}'});
        }
      }
    }
    return name;
  });
}

// Service Classes
for (const file of dir.getSourceFiles()) {
  for (const cls of file.getClasses()) {
    if (cls.getExtends()?.getText() !== 'ExposedService') continue;
    const structure = cls.extractInterface();
    structure.properties = [];
    for (const method of structure.methods) {
      const raw = cls.getMethodOrThrow(method.name);
      if (!raw.getDecorator('api')) {
        delete structure.methods[method.name];
        continue;
      }
      method.docs.push({description: raw.getDecorator('api').getText()});
      method.returnType = transformDynamicImport(raw.getReturnType().getText());
    }
    dtsFile.addInterface(structure);
  }
}

//define
const file = dir.getSourceFile('index.ts');
const services = file.getTypeAliasOrThrow('Services');
dtsFile.addTypeAlias({name: 'Services', isExported: true, type: services.getType().getText(services)});
dtsFile.saveSync();
