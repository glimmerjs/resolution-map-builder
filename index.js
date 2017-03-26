"use strict";

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
  function specifierFromModule(modulePrefix, moduleConfig, modulePath, moduleExtension) {
    let path;
    let collectionPath;

    // TODO allow this setting in the resolver config
    const defaultTypesByExtension = {
      'hbs': 'template'
    };

    // console.log('path', modulePath, 'extension', moduleExtension);

    for (let i = 0, l = moduleConfig.collectionPaths.length; i < l; i++) {
      path = moduleConfig.collectionPaths[i];
      if (modulePath.indexOf(path) === 0) {
        collectionPath = path;
        break;
      }
    }

    if (collectionPath) {
      // trim group/collection from module path
      modulePath = modulePath.substr(collectionPath.length + 1);
    } else {
      collectionPath = 'main';
    }

    let name, type, namespace;
    let collectionName = moduleConfig.collectionMap[collectionPath];
    let collection = moduleConfig.collections[collectionName];
    let parts = modulePath.split('/');
    let part = parts[parts.length - 1];

    if (collection.types.indexOf(part) > -1) {
      type = parts.pop();
      if (parts.length > 0) {
        name = parts.pop();
      } else {
        throw new Error(`The name of module '${modulePath}' could not be identified`);
      }
    } else {
      name = parts.pop();
      if (defaultTypesByExtension[moduleExtension]) {
        type = defaultTypesByExtension[moduleExtension];
      } else if (collection.defaultType) {
        type = collection.defaultType;
      } else {
        throw new Error(`The type of module '${modulePath}' could not be identified`);
      }
    }

    if (parts.length > 0) {
      namespace = parts.join('/');
    }

    let specifierPath = [modulePrefix, collectionName];
    if (namespace) {
      specifierPath.push(namespace);
    }
    specifierPath.push(name);

    let specifier = type + ':/' + specifierPath.join('/');

    return specifier;
  }

  let configPath = path.join(this.inputPaths[1], this.options.configPath);
  let configContents = fs.readFileSync(configPath, { encoding: 'utf8' });
  let config = JSON.parse(configContents);

  let modulePrefix = config.modulePrefix;
  let moduleConfig = getModuleConfig(config);
  let modulePaths = walkSync(this.inputPaths[0]);
  let mappedPaths = [];
  let moduleImports = [];
  let mapContents = [];

  modulePaths.forEach(function(modulePath) {
    if (modulePath.indexOf('.') > -1) {
      let name = modulePath.substring(0, modulePath.lastIndexOf('.'));

      // filter out index module
      if (name !== 'index' && name !== 'main') {
        mappedPaths.push(modulePath);
      }
    }
  });

  if (this.options.logSpecifiers) {
    this.specifiers = [];
  }

  mappedPaths.forEach(modulePath => {
    let module = modulePath.substring(0, modulePath.lastIndexOf('.'));
    let extension = modulePath.substring(modulePath.lastIndexOf('.') + 1);
    let specifier = specifierFromModule(modulePrefix, moduleConfig, module, extension);
    let moduleImportPath = '../' + module;
    let moduleVar = '__' + module.replace(/\//g, '__').replace(/-/g, '_') + '__';
    let moduleImport = "import { default as " + moduleVar + " } from '" + moduleImportPath + "';";
    moduleImports.push(moduleImport);
    mapContents.push("'" + specifier + "': " + moduleVar);

    if (this.options.logSpecifiers) {
      this.specifiers.push(specifier);
    }
  });

  let destPath = path.join(this.outputPath, 'config');
  if (!fs.existsSync(destPath)) {
    fs.mkdirSync(destPath);
  }

  let contents = moduleImports.join('\n') + '\n' +
    "export default {" + mapContents.join(',') + "};" + '\n';

  fs.writeFileSync(path.join(this.outputPath, 'config', 'module-map.js'), contents, { encoding: 'utf8' });
};

module.exports = ResolutionMapBuilder;
