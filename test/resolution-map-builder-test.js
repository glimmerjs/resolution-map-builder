'use strict';

const ResolutionMapBuilder = require('..');
const { build } = require('broccoli-fixture');
const path = require('path');
const assert = require('assert');

describe('resolution-map-builder', function() {
  it('logs specifiers if requested', function() {
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
});