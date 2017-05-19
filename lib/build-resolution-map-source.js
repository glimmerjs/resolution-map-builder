'use strict';

const path = require('path');

const buildResolutionMap = require('./build-resolution-map');
const getModuleIdentifier = require('./get-module-identifier');

/**
 * Generates the JavaScript source code for a resolution map module. The
 * generated source code imports all of the resolved modules, and exports an
 * object that contains specifiers as keys and the module's default export as
 * the value.
 * 
 * @param {Object} options - configuration options for generating the map
 * @param {ModuleConfig} options.moduleConfig - the module config object
 * @param {string} options.modulePrefix - the name of the package the resolution map is being generated for (e.g., the app name)
 * @param {string} options.projectDir - the path to the application or addon root directory
 * @param {string} [options.srcDir=src] - the path of the directory that contains resolvable modules, relative to projectDir
 * @param {string} [options.configPath=config] - the path of the directory where the resolution map will be written, relative to projectDir
 * @param {object} [options.resolutionMap] - a pre-built dictionary with specifiers as keys and module paths as values
 * @param {array} [options.logSpecifiers] - if an array is passed as the logSpecifiers option, encountered specifier strings will be pushed into it
 * 
 * @returns {string} generated source code
 */
module.exports = function(options) {
  let resolutionMap = options.resolutionMap;

  let srcDir = options.srcDir === undefined ? 'src' : options.srcDir;
  let configDir = options.configDir === undefined ? 'config' : options.configDir;
  let configToSrcPath = path.posix.relative(configDir, srcDir);

  if (!resolutionMap) {
    resolutionMap = buildResolutionMap(options);
  }

  let seenModuleVars = Object.create(null);
  let moduleImports = [];
  let mapContents = [];

  for (let specifier in resolutionMap) {
    let modulePath = resolutionMap[specifier];
    let moduleImportPath = path.posix.join(configToSrcPath, modulePath);

    let moduleVar = getModuleIdentifier(seenModuleVars, modulePath);
    let moduleImport = `import { default as ${moduleVar} } from '${moduleImportPath}';`;
    moduleImports.push(moduleImport);
    mapContents.push(`'${specifier}': ${moduleVar}`);

    if (options.logSpecifiers) {
      options.logSpecifiers.push(specifier);
    }
  }

  return moduleImports.join('\n') + `
export default {${mapContents.join(',')}};
`;
}

