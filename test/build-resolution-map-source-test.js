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

  it('can generate JavaScript source for a resolution map module', function () {
    let source = buildResolutionMapSource({
      projectDir: srcFixture.path(),
      moduleConfig: config.moduleConfiguration,
      modulePrefix: config.modulePrefix
    });

    assert.strictEqual(source, `import { default as __ui_components_my_app_component_ts__ } from '../src/ui/components/my-app/component.ts';
import { default as __ui_components_my_app_page_banner_component_ts__ } from '../src/ui/components/my-app/page-banner/component.ts';
import { default as __ui_components_my_app_page_banner_template_hbs__ } from '../src/ui/components/my-app/page-banner/template.hbs';
import { default as __ui_components_my_app_page_banner_titleize_ts__ } from '../src/ui/components/my-app/page-banner/titleize.ts';
import { default as __ui_components_my_app_template_hbs__ } from '../src/ui/components/my-app/template.hbs';
import { default as __ui_components_text_editor_hbs__ } from '../src/ui/components/text-editor.hbs';
import { default as __ui_components_text_editor_ts__ } from '../src/ui/components/text-editor.ts';
export default {'component:/my-app/components/my-app': __ui_components_my_app_component_ts__,'component:/my-app/components/my-app/page-banner': __ui_components_my_app_page_banner_component_ts__,'template:/my-app/components/my-app/page-banner': __ui_components_my_app_page_banner_template_hbs__,'component:/my-app/components/my-app/page-banner/titleize': __ui_components_my_app_page_banner_titleize_ts__,'template:/my-app/components/my-app': __ui_components_my_app_template_hbs__,'template:/my-app/components/text-editor': __ui_components_text_editor_hbs__,'component:/my-app/components/text-editor': __ui_components_text_editor_ts__};
`);
  });
});
