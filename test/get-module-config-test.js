'use strict';

const getModuleConfig = require('../lib/get-module-config');
const assert = require('assert');

describe('get-module-config', function() {
  it('inspects a config and returns a module configuration appended with useful helper functions', function() {
    const types = {
      application: { definitiveCollection: 'main' },
      component: { definitiveCollection: 'components' },
      renderer: { definitiveCollection: 'main' },
      service: { definitiveCollection: 'services' },
      template: { definitiveCollection: 'routes' },
      util: { definitiveCollection: 'utils' }
    };
    const collections = {
      main: {
        types: ['application', 'renderer']
      },
      components: {
        group: 'ui',
        types: ['component', 'template']
      },
      services: {
        types: ['service']
      }
    };
    const config = {
      moduleConfiguration: {
        types,
        collections
      }
    };

    let moduleConfig = getModuleConfig(config);

    assert.ok(moduleConfig, 'moduleConfig returned');
    assert.deepEqual(moduleConfig.types, types, 'types are returned unmodified');
    assert.deepEqual(moduleConfig.collections, collections, 'collections are returned unmodified');
    assert.deepEqual(moduleConfig.collectionMap, {
      'main': 'main',
      'ui/components': 'components',
      'services': 'services'
    }, 'collectionMap has been generated');
    assert.deepEqual(moduleConfig.collectionPaths, [
      'main',
      'ui/components',
      'services'
    ], 'collectionPaths has been generated');
  });
});
