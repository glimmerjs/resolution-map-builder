'use strict';

const ResolutionMapBuilder = require('..');
const getModuleIdentifier = ResolutionMapBuilder._getModuleIdentifier;
const shouldIgnore = ResolutionMapBuilder._shouldIgnore;
const path = require('path');
const fs = require('fs');
const co = require('co');
const assert = require('assert');
const BroccoliTestHelper = require('broccoli-test-helper');
const buildOutput = BroccoliTestHelper.buildOutput;
const createTempDir = BroccoliTestHelper.createTempDir;
const walkSync = require('walk-sync');

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
                  "ignore-me.d.ts": "",
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

  it('can read a config file, parse modules at specified path, and log specifiers (if requested)', co.wrap(function* () {
    let options = { configPath: 'environment.json', baseDir: 'src', logSpecifiers: true };

    let mapBuilder = new ResolutionMapBuilder(srcFixture.path(), configFixture.path(), options);

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

  it('emits a .d.ts file', co.wrap(function* () {
    let options = { configPath: 'environment.json', logSpecifiers: true };

    let mapBuilder = new ResolutionMapBuilder(srcFixture.path() + '/src', configFixture.path(), options);

    let output = yield buildOutput(mapBuilder);

    assert.ok(output.read().config['module-map.d.ts'], 'module-map.d.ts was present');
  }));

  it('emits files in correct locations', co.wrap(function* () {
    let options = { configPath: 'environment.json' };

    let mapBuilder = new ResolutionMapBuilder(srcFixture.path() + '/src', configFixture.path(), options);

    let output = yield buildOutput(mapBuilder);

    let entries = walkSync(output.path(), { directories: false });

    assert.deepEqual(entries, [
      'config/module-map.d.ts',
      'config/module-map.js'
    ]);
  }));

  it('errors if two files compiled to the same specifiers', co.wrap(function* () {
    let options = { configPath: 'environment.json', logSpecifiers: true };

    yield srcFixture.dispose();

    srcFixture.write({
      "src": {
        "ui": {
          "components": {
            "foo-bar.ts": 'export default class { }',
            "foo-bar": {
              "component.ts": 'export default class { }'
            }
          }
        }
      }
    });

    let mapBuilder = new ResolutionMapBuilder(srcFixture.path() + '/src', configFixture.path(), options);

    buildOutput(mapBuilder)
      .catch(error => {
        assert.equal(error.name, 'Both `ui/components/foo-bar.ts` and `ui/components/foo-bar/component.ts` represent component:/my-app/components/foo-bar, please rename one to remove the collision.');
      })
      .then(() => assert.ok(false, 'should have errored'));
  }));

  it('does not error if two files compiled to null specifiers', co.wrap(function* () {
    let options = { configPath: 'environment.json', logSpecifiers: true };

    yield srcFixture.dispose();

    srcFixture.write({
      "src": {
        "utils": {
          "thing.ts": '// here',
          "other.ts": '// stuff'
        }
      }
    });

    let mapBuilder = new ResolutionMapBuilder(srcFixture.path() + '/src', configFixture.path(), options);

    yield buildOutput(mapBuilder);
  }));

  describe('getModuleIdentifier', function() {
    it('does not reuse the same variable name', function() {
      let seen = { 'foo': 'foo' };
      let actual = getModuleIdentifier(seen, 'foo');

      assert.notEqual(actual, '__foo__', 'does not create an already seen token');
    });

    it('does not make symbols that are invalid js identifiers', function() {
      let seen = { };
      let bizarreValues = [
        '#foo',
        '.derp',
        ':wat',
        'huzzaa/lola@/foo',
        'chinkies/flerbity/%ads'
      ];

      bizarreValues.forEach((modulePath) => {
        let identifier = getModuleIdentifier(seen, modulePath);
        assert.doesNotThrow(
          () => new Function(`var ${identifier} = true; return ${identifier};`),
          `Generating an identifier for ${modulePath} should not throw`
        );
      });
    });
  });

  describe('shouldIgnore', function() {
    function generateTest(modulePath, expected) {
      it(`${expected ? 'should ignore' : 'should not ignore'} ${modulePath}`, function() {
        let pathParts = path.parse(modulePath);

        assert.equal(shouldIgnore(pathParts), expected);
      });
    }

    let cases = {
      'src/ui/components/foo-bar.ts': false,
      'src/ui/components/.foo-bar.ts': true,
      'src/ui/components/other.d.ts': true,
      'src/ui/components/foo-bar.md': true,
      'src/ui/index.html': true,
      'src/ui/components/README.md': true,
      'src/ui/.eslintrc': true
    };

    for (let modulePath in cases) {
      generateTest(modulePath, cases[modulePath]);
    }
  });
});
