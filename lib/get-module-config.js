'use strict';

module.exports = function(json) {
  let collections = json.collections;
  let types = json.types;
  let moduleConfig = { collections, types };
  let collectionMap = {};
  let collectionPaths = [];
  let collectionNames = Object.keys(collections);
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

  return moduleConfig;
};
