const Plugin = require('broccoli-plugin');
const fs = require('fs');
const path = require('path');
const walkSync = require('walk-sync');
const getModuleConfig = require('./lib/get-module-config');

function ResolutionMapBuilder(src, config, options) {
  options = options || {};
  Plugin.call(this, [src, config], {
    annotation: options.annotation
  });
  this.options = options;
}

ResolutionMapBuilder.prototype = Object.create(Plugin.prototype);

ResolutionMapBuilder.prototype.constructor = ResolutionMapBuilder;

ResolutionMapBuilder.prototype.build = function() {
  function specifierFromModule(modulePrefix, moduleConfig, modulePath) {
    let path;
    let collectionPath;

    for (let i = 0, l = moduleConfig.collectionPaths.length; i < l; i++) {
      path = moduleConfig.collectionPaths[i];
      if (modulePath.indexOf(path) === 0) {
        collectionPath = path;
        break;
      }
    }

    if (collectionPath) {
      // trim group/collection from module path
      modulePath = modulePath.substr(collectionPath.length);
    } else {
      collectionPath = 'main';
    }
    let parts = modulePath.split('/');

    let collectionName = moduleConfig.collectionMap[collectionPath];

    let name, type, namespace;
    if (parts.length > 1) {
      type = parts.pop();
    }
    name = parts.pop();
    if (parts.length > 0) {
      namespace = parts.join('/');
    }

    let specifierPath = [modulePrefix, collectionName];
    if (namespace) {
      specifierPath.push(namespace);
    }
    specifierPath.push(name);

    let specifier = type + ':/' + specifierPath.join('/');

    console.log('specifier:', specifier);

    return specifier;
  }

  let configPath = path.join(this.inputPaths[1], this.options.configPath);
  let configContents = fs.readFileSync(configPath, { encoding: 'utf8' });
  let config = JSON.parse(configContents);

  let modulePrefix = config.modulePrefix;
  let moduleConfig = getModuleConfig(config);
  let paths = walkSync(this.inputPaths[0]);
  let modules = [];
  let moduleImports = [];
  let mapContents = [];

  paths.forEach(function(entry) {
    if (entry.indexOf('.') > -1) {
      let module = entry.substring(0, entry.lastIndexOf('.'));

      // filter out index module
      if (module !== 'index' && module !== 'main') {
        modules.push(module);
      }
    }
  });
  modules.forEach(function(module) {
    let specifier = specifierFromModule(modulePrefix, moduleConfig, module);
    let moduleImportPath = '../' + module;
    let moduleVar = '__' + module.replace(/\//g, '__').replace(/-/g, '_') + '__';
    let moduleImport = "import { default as " + moduleVar + " } from '" + moduleImportPath + "';";
    moduleImports.push(moduleImport);
    mapContents.push("'" + specifier + "': " + moduleVar);
  });
  let destPath = path.join(this.outputPath, 'config');
  if (!fs.existsSync(destPath)) {
    fs.mkdirSync(destPath);
  }

  let contents = moduleImports.join('\n') + '\n' +
    "export default moduleMap = {" + mapContents.join(',') + "};" + '\n';

  fs.writeFileSync(path.join(this.outputPath, 'config', 'module-map.js'), contents, { encoding: 'utf8' });
};

module.exports = ResolutionMapBuilder;
