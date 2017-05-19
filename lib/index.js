"use strict";

const Plugin = require('broccoli-plugin');
const fs = require('fs');
const path = require('path');

const buildResolutionMap = require('./build-resolution-map');
const buildResolutionMapSource = require('./build-resolution-map-source');
const getModuleIdentifier = require('./get-module-identifier');
const getModuleSpecifier = require('./get-module-specifier');
const shouldIgnore = require('./should-ignore');

const INTERFACE = `
export interface Dict<T> {
    [index: string]: T;
}
declare let map: Dict<any>;
export default map;
`;

function buildResolutionMapTypeDefinitions() {
  return INTERFACE;
}

function ResolutionMapBuilder(src, config, options) {
  options = options || {};
  Plugin.call(this, [src, config], {
    annotation: options.annotation
  });
  this.options = options;

  if (options.logSpecifiers) {
    this.specifiers = [];
  }
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

  let moduleConfig = config.moduleConfiguration || this.options.defaultModuleConfiguration;
  if (!moduleConfig) {
    throw new Error(`The module configuration could not be found. Please add a config file to '${configPath}' and export an object with a 'moduleConfiguration' member.`);
  }

  let modulePrefix = config.modulePrefix || this.options.defaultModulePrefix;
  if (!modulePrefix) {
    throw new Error(`The module prefix could not be found. Add a config file to '${configPath}' and export an object with a 'modulePrefix' member.`);
  }

  let srcDir = this.options.srcDir || '';

  let contents = buildResolutionMapSource({
    projectDir: this.inputPaths[0],
    logSpecifiers: this.specifiers,
    srcDir,
    moduleConfig,
    modulePrefix
  });

  let destPath = path.posix.join(this.outputPath, 'config');
  if (!fs.existsSync(destPath)) {
    fs.mkdirSync(destPath);
  }

  fs.writeFileSync(path.posix.join(destPath, 'module-map.js'), contents, { encoding: 'utf8' });
  fs.writeFileSync(path.posix.join(destPath, 'module-map.d.ts'), INTERFACE, { encoding: 'utf8' });
};

module.exports = ResolutionMapBuilder;
module.exports._getModuleIdentifier = getModuleIdentifier;
module.exports._getModuleSpecifier = getModuleSpecifier;
module.exports._shouldIgnore = shouldIgnore;
module.exports.buildResolutionMap = buildResolutionMap;
module.exports.buildResolutionMapSource = buildResolutionMapSource;
module.exports.buildResolutionMapTypeDefinitions = buildResolutionMapTypeDefinitions;
