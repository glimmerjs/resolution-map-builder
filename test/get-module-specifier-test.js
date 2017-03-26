'use strict';

const getModuleConfig = require('../lib/get-module-config');
const getModuleSpecifier = require('../lib/get-module-specifier');
const assert = require('assert');

describe('get-module-specifier', function() {
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
      types: ['component', 'template'],
      defaultType: 'component'
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
  const modulePrefix = 'my-app';

  let moduleConfig;

  beforeEach(function() {
    moduleConfig = getModuleConfig(config);
  });

  it('identifies named modules in the root of a collection as the default type for that collection', function() {
    let modulePath = 'ui/components/text-editor';
    let moduleExtension = 'js';
    assert.equal(getModuleSpecifier(modulePrefix, moduleConfig, modulePath, moduleExtension),
      'component:/my-app/components/text-editor'
    );
  });

  it('identifies named modules in the root of a collection as the default type for their extension', function() {
    let modulePath = 'ui/components/text-editor';
    let moduleExtension = 'hbs';
    assert.equal(getModuleSpecifier(modulePrefix, moduleConfig, modulePath, moduleExtension),
      'template:/my-app/components/text-editor'
    );
  });

  it('identifies name/type modules in a collection', function() {
    let modulePath = 'ui/components/text-editor/component';
    let moduleExtension = 'js';
    assert.equal(getModuleSpecifier(modulePrefix, moduleConfig, modulePath, moduleExtension),
      'component:/my-app/components/text-editor'
    );
  });

  it('identifies name/type modules with an extension that has a default type', function() {
    let modulePath = 'ui/components/text-editor/template';
    let moduleExtension = 'hbs';
    assert.equal(getModuleSpecifier(modulePrefix, moduleConfig, modulePath, moduleExtension),
      'template:/my-app/components/text-editor'
    );
  });

  it('identifies namespace/name/type modules in a collection', function() {
    let modulePath = 'ui/components/edit-form/text-editor/component';
    let moduleExtension = 'js';
    assert.equal(getModuleSpecifier(modulePrefix, moduleConfig, modulePath, moduleExtension),
      'component:/my-app/components/edit-form/text-editor'
    );
  });

  it('identifies namespace/name modules as the default type for a collection', function() {
    let modulePath = 'ui/components/edit-form/text-editor';
    let moduleExtension = 'js';
    assert.equal(getModuleSpecifier(modulePrefix, moduleConfig, modulePath, moduleExtension),
      'component:/my-app/components/edit-form/text-editor'
    );
  });

  it('identifies namespace/name modules as the default type for their extension', function() {
    let modulePath = 'ui/components/edit-form/text-editor';
    let moduleExtension = 'hbs';
    assert.equal(getModuleSpecifier(modulePrefix, moduleConfig, modulePath, moduleExtension),
      'template:/my-app/components/edit-form/text-editor'
    );
  });
});
