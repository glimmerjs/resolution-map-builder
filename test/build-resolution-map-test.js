const { buildResolutionMap } = require('..');
const { createTempDir } = require('broccoli-test-helper');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

describe('buildResolutionMap', function () {
  let configPath = path.join(__dirname, 'fixtures/config/environment.json');
  let config = JSON.parse(fs.readFileSync(configPath));
  let srcFixture;

  beforeEach(function () {
    return createTempDir().then(src => {
      srcFixture = src;

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
    });
  });

  afterEach(function () {
    srcFixture.dispose();
  });

  it('can generate a resolution map', function () {
    let map = buildResolutionMap({
      projectDir: srcFixture.path(),
      moduleConfig: config.moduleConfiguration,
      modulePrefix: config.modulePrefix
    });

    assert.deepEqual(map, {
      'component:/my-app/components/my-app': 'ui/components/my-app/component.ts',
      'component:/my-app/components/my-app/page-banner': 'ui/components/my-app/page-banner/component.ts',
      'template:/my-app/components/my-app/page-banner': 'ui/components/my-app/page-banner/template.hbs',
      'component:/my-app/components/my-app/page-banner/titleize': 'ui/components/my-app/page-banner/titleize.ts',
      'template:/my-app/components/my-app': 'ui/components/my-app/template.hbs',
      'template:/my-app/components/text-editor': 'ui/components/text-editor.hbs',
      'component:/my-app/components/text-editor': 'ui/components/text-editor.ts'
    })
  });
});
