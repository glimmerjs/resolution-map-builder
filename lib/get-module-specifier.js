'use strict';

module.exports = function(modulePrefix, moduleConfig, modulePath, moduleExtension) {
    let path;
    let collectionPath;

    // TODO allow this setting in the resolver config
    const defaultTypesByExtension = {
      'hbs': 'template',
      'handlebars': 'template'
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
};
