const fs = require('fs');
const path = require('path');
const Plugin = require('broccoli-plugin');

function ModuleMapCreator(src, config, options) {
  options = options || {};
  Plugin.call(this, [src, config], {
    annotation: options.annotation
  });
  this.options = options;
}

ModuleMapCreator.prototype = Object.create(Plugin.prototype);

ModuleMapCreator.prototype.constructor = ModuleMapCreator;

ModuleMapCreator.prototype.getConfig = function() {
  var configPath = path.join(this.inputPaths[1], this.options.configPath);
  var contents = fs.readFileSync(configPath, { encoding: 'utf8' });
  return JSON.parse(contents);
};

ModuleMapCreator.prototype.build = function() {
  function getModuleConfig(config) {
    var moduleConfig = config.moduleConfiguration;

    var collectionMap = {};
    var collectionPaths = [];
    var collections = moduleConfig.collections;
    var collectionNames = Object.keys(collections);
    collectionNames.forEach(function(collectionName) {
      var collection = collections[collectionName];
      var fullPath = collectionName;
      if (collection.group) {
        fullPath = collection.group + '/' + fullPath;
      }
      collectionPaths.push(fullPath);
      collectionMap[fullPath] = collectionName;
    });

    moduleConfig.collectionMap = collectionMap;
    moduleConfig.collectionPaths = collectionPaths;

    // console.log('moduleConfig', moduleConfig);

    return moduleConfig;
  }

  function specifierFromModule(modulePath, moduleConfig) {
    var path;
    var collectionPath;

    for (var i = 0, l = moduleConfig.collectionPaths.length; i < l; i++) {
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
    var parts = modulePath.split('/');

    var rootName = 'app';
    var collectionName = moduleConfig.collectionMap[collectionPath];

    var name, type, namespace;
    if (parts.length > 1) {
      type = parts.pop();
    }
    name = parts.pop();
    if (parts.length > 0) {
      namespace = parts.join('/');
    }

    var specifierPath = [rootName, collectionName];
    if (namespace) {
      specifierPath.push(namespace);
    }
    specifierPath.push(name);

    var specifier = type + ':/' + specifierPath.join('/');

    // console.log('specifier:', specifier);

    return specifier;
  }

  var config = this.getConfig();
  var moduleConfig = getModuleConfig(config);
  var paths = walkSync(this.inputPaths[0]);
  var modules = [];
  var moduleImports = [];
  var mapContents = [];

  paths.forEach(function(entry) {
    if (entry.indexOf('.') > -1) {
      var module = entry.substring(0, entry.lastIndexOf('.'));

      // filter out index module
      if (module !== 'index' && module !== 'main') {
        modules.push(module);
      }
    }
  });
  modules.forEach(function(module) {
    var specifier = specifierFromModule(module, moduleConfig);
    var moduleImportPath = '../' + module;
    var moduleVar = '__' + module.replace(/\//g, '__').replace(/-/g, '_') + '__';
    var moduleImport = "import { default as " + moduleVar + " } from '" + moduleImportPath + "';";
    moduleImports.push(moduleImport);
    mapContents.push("'" + specifier + "': " + moduleVar);
  });
  var destPath = path.join(this.outputPath, 'config');
  if (!fs.existsSync(destPath)) {
    fs.mkdirSync(destPath);
  }

  var contents = moduleImports.join('\n') + '\n' +
    "export default moduleMap = {" + mapContents.join(',') + "};" + '\n';

  fs.writeFileSync(path.join(this.outputPath, 'config', 'module-map.ts'), contents, { encoding: 'utf8' });
};

module.exports = ModuleMapCreator;
