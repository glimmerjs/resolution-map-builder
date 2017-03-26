"use strict";

const Plugin = require('broccoli-plugin');
const fs = require('fs');
const path = require('path');
const walkSync = require('walk-sync');
const getModuleConfig = require('./lib/get-module-config');
const getModuleSpecifier = require('./lib/get-module-specifier');

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
    let specifier = getModuleSpecifier(modulePrefix, moduleConfig, module, extension);
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
