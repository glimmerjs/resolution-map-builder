'use strict';

const buildResolutionMapSource = require('..').buildResolutionMapSource;
const createTempDir = require('broccoli-test-helper').createTempDir;
const fs = require('fs');
const path = require('path');
const assert = require('assert');

describe('buildResolutionMapSource', function () {
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
              }
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

  it('can generate JavaScript source for a resolution map module', function () {
    let source = buildResolutionMapSource({
      projectDir: srcFixture.path(),
      moduleConfig: config.moduleConfiguration,
      modulePrefix: config.modulePrefix
    });

    assert.strictEqual(source, `import { default as __ui_components_my_app_component__ } from '../src/ui/components/my-app/component';
import { default as __ui_components_my_app_page_banner_component__ } from '../src/ui/components/my-app/page-banner/component';
import { default as __ui_components_my_app_page_banner_template__ } from '../src/ui/components/my-app/page-banner/template';
import { default as __ui_components_my_app_page_banner_titleize__ } from '../src/ui/components/my-app/page-banner/titleize';
import { default as __ui_components_my_app_template__ } from '../src/ui/components/my-app/template';
export default {'component:/my-app/components/my-app': __ui_components_my_app_component__,'component:/my-app/components/my-app/page-banner': __ui_components_my_app_page_banner_component__,'template:/my-app/components/my-app/page-banner': __ui_components_my_app_page_banner_template__,'component:/my-app/components/my-app/page-banner/titleize': __ui_components_my_app_page_banner_titleize__,'template:/my-app/components/my-app': __ui_components_my_app_template__};
`);
  });
});
