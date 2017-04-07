'use strict';

const ResolutionMapBuilder = require('..');
const path = require('path');
const fs = require('fs');
const co = require('co');
const assert = require('assert');
const BroccoliTestHelper = require('broccoli-test-helper');
const buildOutput = BroccoliTestHelper.buildOutput;
const createTempDir = BroccoliTestHelper.createTempDir;

describe('resolution-map-builder', function() {
  let configFixture, srcFixture;

  beforeEach(function() {
    return Promise.all([
      createTempDir(),
      createTempDir()
    ]).then((results) => {
      srcFixture = results[0];
      configFixture = results[1];

      srcFixture.write({
        "src": {
          "ui": {
            "components": {
              "my-app": {
                "README.md": "## My-App Component\n",
                "component.ts": "",
                "page-banner": {
                  "-utils": {
                    "ignore-me.ts": ""
                  },
                  "component.ts": "",
                  "template.hbs": "",
                  "titleize.ts": ""
                },
                "template.hbs": ""
              },
              "text-editor.hbs": "",
              "text-editor.ts": ""
            },
            "index.html": "<html>\n    <head></head>\n    <body></body>\n</html>\n"
          }
        }
      });

      let configPath = path.join(__dirname, 'fixtures', 'config', 'environment.json');
      configFixture.write({
        'environment.json': fs.readFileSync(configPath, { encoding: 'utf8' })
      })
    });
  });

  afterEach(function() {
    return Promise.all([
      srcFixture.dispose(),
      configFixture.dispose()
    ]);
  });

  it('can read a config file, parse modules, and log specifiers (if requested)', co.wrap(function* () {
    let options = { configPath: 'environment.json', logSpecifiers: true };

    let mapBuilder = new ResolutionMapBuilder(srcFixture.path() + '/src', configFixture.path(), options);

    yield buildOutput(mapBuilder);

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
  }));

  it('can use config options if no config file exists', co.wrap(function* () {
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

    let mapBuilder = new ResolutionMapBuilder(srcFixture.path() + '/src', configFixture.path(), options);

    yield buildOutput(mapBuilder);

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
  }));
});
