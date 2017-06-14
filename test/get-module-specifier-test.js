'use strict';

const getModuleConfig = require('../lib/get-module-config');
const getModuleSpecifier = require('../lib/get-module-specifier');
const assert = require('assert');

describe('get-module-specifier', function() {
  const types = {
    application: { definitiveCollection: 'main' },
    component: { definitiveCollection: 'components' },
    'component-test': { unresolvable: true },
    renderer: { definitiveCollection: 'main' },
    route: { definitiveCollection: 'routes' },
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
      types: ['component', 'template', 'component-test'],
      defaultType: 'component',
      privateCollections: ['utils']
    },
    routes: {
      group: 'ui',
      types: ['route', 'controller', 'template'],
      defaultType: 'route',
      privateCollections: ['components', 'utils']
    },
    services: {
      types: ['service'],
      defaultType: 'service',
      privateCollections: ['utils']
    },
    utils: {
      unresolvable: true
    }
  };
  const resolverConfig = {
    types,
    collections
  };
  const modulePrefix = 'my-app';

  let moduleConfig;

  beforeEach(function() {
    moduleConfig = getModuleConfig(resolverConfig);
  });

  it('identifies name/type modules in a collection', function() {
    let modulePath = 'ui/components/text-editor/component';
    assert.equal(getModuleSpecifier(modulePrefix, moduleConfig, modulePath),
      'component:/my-app/components/text-editor'
    );
  });

  it('identifies name/type modules with an extension that has a default type', function() {
    let modulePath = 'ui/components/text-editor/template';
    assert.equal(getModuleSpecifier(modulePrefix, moduleConfig, modulePath),
      'template:/my-app/components/text-editor'
    );
  });

  it('identifies namespace/name/type modules in a collection', function() {
    let modulePath = 'ui/components/edit-form/text-editor/component';
    assert.equal(getModuleSpecifier(modulePrefix, moduleConfig, modulePath),
      'component:/my-app/components/edit-form/text-editor'
    );
  });

  it('identifies namespace/name modules as the default type for a collection', function() {
    let modulePath = 'ui/components/edit-form/text-editor';
    assert.equal(getModuleSpecifier(modulePrefix, moduleConfig, modulePath),
      'component:/my-app/components/edit-form/text-editor'
    );
  });

  it('identifies modules as the default type in private collections', function() {
    let modulePath = 'ui/routes/posts/-components/edit-form';
    assert.equal(getModuleSpecifier(modulePrefix, moduleConfig, modulePath),
      'component:/my-app/routes/posts/-components/edit-form'
    );
  });

  it('identifies namespace/name/type modules in a private collection', function() {
    let modulePath = 'ui/routes/posts/-components/edit-form/text-editor/component';
    assert.equal(getModuleSpecifier(modulePrefix, moduleConfig, modulePath),
      'component:/my-app/routes/posts/-components/edit-form/text-editor'
    );
  });

  it('returns null for modules in unresolvable collections', function() {
    let modulePath = 'ui/routes/posts/-utils/ignore-me';
    assert.equal(getModuleSpecifier(modulePrefix, moduleConfig, modulePath),
      null
    );
  });

  it('returns null for modules of unresolvable types', function() {
    let modulePath = 'ui/components/post/component-test';
    assert.equal(getModuleSpecifier(modulePrefix, moduleConfig, modulePath),
      null
    );
  });
});
