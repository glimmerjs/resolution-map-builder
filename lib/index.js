"use strict";

const Plugin = require('broccoli-plugin');
const fs = require('fs');
const path = require('path');
const walkSync = require('walk-sync');
const getModuleConfig = require('./get-module-config');
const getModuleSpecifier = require('./get-module-specifier');

const IGNORED_EXTENSIONS = ['', '.md', '.html'];
const INTERFACE = `
export interface Dict<T> {
    [index: string]: T;
}
declare let map: Dict<any>;
export default map;
`;

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
  // Attempt to read config file
  let configPath = path.posix.join(this.inputPaths[1], this.options.configPath);
  let config;
  if (fs.existsSync(configPath)) {
    let configContents = fs.readFileSync(configPath, { encoding: 'utf8' });
    config = JSON.parse(configContents);
  } else {
    config = {};
  }

  let moduleConfig = getModuleConfig(config.moduleConfiguration || this.options.defaultModuleConfiguration);
  if (!moduleConfig) {
    throw new Error(`The module configuration could not be found. Please add a config file to '${configPath}' and export an object with a 'moduleConfiguration' member.`);
  }

  let modulePrefix = config.modulePrefix || this.options.defaultModulePrefix;
  if (!modulePrefix) {
    throw new Error(`The module prefix could not be found. Add a config file to '${configPath}' and export an object with a 'modulePrefix' member.`);
  }

  let baseDir = this.options.baseDir || '';
  let modulePath = path.posix.join(this.inputPaths[0], baseDir);
  let modulePaths = walkSync(modulePath);
  let mappedPaths = [];
  let moduleImports = [];
  let mapContents = [];

  modulePaths.forEach(function(modulePath) {
    let pathParts = path.parse(modulePath);

    if (IGNORED_EXTENSIONS.indexOf(pathParts.ext) > -1 || pathParts.base.slice(-5) === '.d.ts') {
      return;
    }

    let name = path.posix.join(pathParts.dir, pathParts.name);

    // filter out index module
    if (name !== 'index' && name !== 'main') {
      mappedPaths.push(modulePath);
    }
  });

  if (this.options.logSpecifiers) {
    this.specifiers = [];
  }

  mappedPaths.forEach(modulePath => {
    let module = modulePath.substring(0, modulePath.lastIndexOf('.'));
    let extension = modulePath.substring(modulePath.lastIndexOf('.') + 1);
    let specifier = getModuleSpecifier(modulePrefix, moduleConfig, module, extension);

    // Only process non-null specifiers returned.
    // Specifiers may be null in the case of an unresolvable collection (e.g. utils)
    if (specifier) {
      let moduleImportPath = path.posix.join('..', baseDir, module);
      let moduleVar = '__' + module.replace(/\//g, '__').replace(/-/g, '_') + '__';
      let moduleImport = "import { default as " + moduleVar + " } from '" + moduleImportPath + "';";
      moduleImports.push(moduleImport);
      mapContents.push("'" + specifier + "': " + moduleVar);

      if (this.options.logSpecifiers) {
        this.specifiers.push(specifier);
      }
    }
  });

  let destPath = path.posix.join(this.outputPath, 'config');
  if (!fs.existsSync(destPath)) {
    fs.mkdirSync(destPath);
  }

  let contents = moduleImports.join('\n') + '\n' +
    "export default {" + mapContents.join(',') + "};" + '\n';

  fs.writeFileSync(path.posix.join(this.outputPath, 'config', 'module-map.js'), contents, { encoding: 'utf8' });
  fs.writeFileSync(path.posix.join(this.outputPath, 'config', 'module-map.d.ts'), INTERFACE, { encoding: 'utf8' });
};

module.exports = ResolutionMapBuilder;
