'use strict';

const path = require('path');
const walkSync = require('walk-sync');
const SilentError = require('silent-error');

const getModuleConfig = require('./get-module-config');
const getModuleSpecifier = require('./get-module-specifier');
const shouldIgnore = require('./should-ignore');

/**
 * Given a module config, module prefix and input directory, returns
 * a dictionary with module specifier as the key and the module path (relative
 * to the input directory) as the value.
 * 
 * For example, given this directory:
 * 
 *     src/
 *       ui/
 *         components/
 *           user-avatar/
 *             template.hbs
 *             component.js
 * 
 * This function returns:
 * 
 *     {
 *       "component:/my-app/components/my-app": "ui/components/user-avatar/component",
 *       "template:/my-app/components/my-app": "ui/components/user-avatar/template"
 *     }
 * 
 * @param {object} options - configuration options for generating the map
 * @param {ModuleConfig} options.moduleConfig - the module config object
 * @param {string} options.modulePrefix - the name of the package the resolution map is being generated for (e.g., the app name)
 * @param {string} options.projectDir - the path to the application or addon root directory
 * @param {string} [options.srcDir=src] - the path of the directory that contains resolvable modules, relative to projectDir
 */
module.exports = function(options) {
  validateOptions(options);

  let moduleConfig = getModuleConfig(options.moduleConfig);
  let modulePrefix = options.modulePrefix;
  let srcDir = options.srcDir;
  let projectDir = options.projectDir;

  srcDir = srcDir === undefined ? 'src' : srcDir;

  let rootPath = path.join(projectDir, srcDir);
  let mappedPaths = [];

  // Build an array containing all recursive files and directories in the root
  // directory.
  let modulePaths = walkSync(rootPath);

  // Filter out modules that should be ignored.
  modulePaths.forEach(function(modulePath) {
    let pathParts = path.parse(modulePath);

    if (shouldIgnore(pathParts)) {
      return;
    }

    let name = path.posix.join(pathParts.dir, pathParts.name);

    // filter out index module
    if (name !== 'index' && name !== 'main') {
      mappedPaths.push(name);
    }
  });

  let resolutionMap = Object.create(null);

  // Loop through module paths and create an entry in the resolution map, from
  // specifier to module path.
  mappedPaths.forEach(modulePath => {
    let pathParts = path.parse(modulePath);
    let module = path.posix.join(pathParts.dir, pathParts.name);
    let specifier = getModuleSpecifier(modulePrefix, moduleConfig, module);

    // Only process non-null specifiers returned.
    // Specifiers may be null in the case of an unresolvable collection (e.g. utils)
    if (specifier) {
      if (resolutionMap[specifier]) {
        throw new SilentError(`Both \`${resolutionMap[specifier]}\` and \`${modulePath}\` represent ${specifier}, please rename one to remove the collision.`);
      } else {
        resolutionMap[specifier] = modulePath;
      }
    }
  });

  return resolutionMap;
}

function validateOptions(options) {
  if (typeof options !== 'object') {
    throw new Error('You must pass an options object to buildResolutionMap.');
  }

  if (typeof options.moduleConfig !== 'object') {
    throw new Error('You must pass a module configuration object to buildResolutionMap, like buildResolutionMap({ moduleConfig: ... }).');
  }

  if (typeof options.modulePrefix !== 'string') {
    throw new Error('You must pass the module prefix string to buildResolutionMap, like buildResolutionMap({ modulePrefix: "app" }).');
  }

  if (typeof options.projectDir !== 'string') {
    throw new Error('You must pass the app or addon path to buildResolutionMap, like buildResolutionMap({ projectDir: "my-app" }).');
  }
}
