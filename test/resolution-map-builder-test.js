'use strict';

const ResolutionMapBuilder = require('..');
const { build } = require('broccoli-fixture');
const path = require('path');
const assert = require('assert');

describe('resolution-map-builder', function() {
  it('can read a config file, parse modules, and log specifiers (if requested)', function() {
    let src = path.join(process.cwd(), 'test', 'fixtures', 'src');
    let config = path.join(process.cwd(), 'test', 'fixtures', 'config');
    let options = { configPath: 'environment.json', logSpecifiers: true };

    let mapBuilder = new ResolutionMapBuilder(src, config, options);

    return build(mapBuilder)
      .then(result => {
        assert.deepEqual(
          mapBuilder.specifiers.sort(),
          [
            'component:/my-app/components/my-app',
            'template:/my-app/components/my-app',

            'component:/my-app/components/text-editor',
            'template:/my-app/components/text-editor',

            'component:/my-app/components/my-app/page-banner',
            'template:/my-app/components/my-app/page-banner',
            'component:/my-app/components/my-app/page-banner/titleize'
          ].sort()
        );
      });
  });

  it('can use config options if no config file exists', function() {
    let src = path.join(process.cwd(), 'test', 'fixtures', 'src');
    let config = path.join(process.cwd(), 'test', 'fixtures', 'config');
    let options = {
      defaultModulePrefix: 'my-app',
      defaultModuleConfiguration: {
        "types": {
          "application": { "definitiveCollection": "main" },
          "component": { "definitiveCollection": "components" },
          "renderer": { "definitiveCollection": "main" },
          "template": { "definitiveCollection": "components" },
          "util": { "definitiveCollection": "utils" }
        },
        "collections": {
          "main": {
            "types": ["application", "renderer"]
          },
          "components": {
            "group": "ui",
            "types": ["component", "template"],
            "defaultType": "component",
            "privateCollections": ["utils"]
          },
          "utils": {
            "unresolvable": true
          }
        }
      },
      configPath: 'DOES_NOT_EXIST.json',
      logSpecifiers: true
    };

    let mapBuilder = new ResolutionMapBuilder(src, config, options);

    return build(mapBuilder)
      .then(result => {
        assert.deepEqual(
          mapBuilder.specifiers.sort(),
          [
            'component:/my-app/components/my-app',
            'template:/my-app/components/my-app',

            'component:/my-app/components/text-editor',
            'template:/my-app/components/text-editor',

            'component:/my-app/components/my-app/page-banner',
            'template:/my-app/components/my-app/page-banner',
            'component:/my-app/components/my-app/page-banner/titleize'
          ].sort()
        );
      });
  });
});
