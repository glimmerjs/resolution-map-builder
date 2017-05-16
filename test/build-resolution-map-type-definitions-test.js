const { buildResolutionMapTypeDefinitions } = require('..');
const assert = require('assert');

describe('buildResolutionMapTypeDefinitions', function() {
  it('emits TypeScript source', function() {
    let source = buildResolutionMapTypeDefinitions();

    assert.strictEqual(source, `
export interface Dict<T> {
    [index: string]: T;
}
declare let map: Dict<any>;
export default map;
`);
  });
});
