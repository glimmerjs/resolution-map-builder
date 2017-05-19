'use strict';

/**
 * Generates a valid, unique JavaScript identifier for a module path.
 * 
 * @param {array} seen an array of identifiers used in this scope
 * @param {string} modulePath the module path
 * @returns {string} identifier a valid JavaScript identifier
 */
module.exports = function getModuleIdentifier(seen, modulePath) {
  let identifier = modulePath
      // replace any non letter, non-number, non-underscore
      .replace(/[\W]/g, '_');

  // if we have already generated this identifier
  // prefix with an _ until we find a unique one
  while (seen[identifier]) {
    identifier = `_${identifier}`;
  }

  seen[identifier] = modulePath;

  return `__${identifier}__`;
}
