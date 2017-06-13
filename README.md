# resolution-map-builder [![Build Status](https://secure.travis-ci.org/glimmerjs/resolution-map-builder.svg?branch=master)](http://travis-ci.org/glimmerjs/resolution-map-builder)

Utilities and a Broccoli plugin for building a resolution map compatible with
[@glimmerjs/resolver](https://github.com/glimmerjs/glimmer-resolver)
and the expectations of Ember's
[module unification RFC](https://github.com/emberjs/rfcs/blob/master/text/0143-module-unification.md).

This package is a low-level utility and most people should not need to use it
directly. A new Glimmer app will be configured to generate the resolution map
automatically via the
[`@glimmer/application-pipeline`](http://github.com/glimmerjs/glimmer-application-pipeline)
package.

## The Resolution Map

Glimmer uses a [resolver](https://github.com/glimmerjs/glimmer-resolver) to
locate your app's modules. For example, if you use the component
`<my-component>` in a template, the resolver is what tells Glimmer that that
component lives in your app's `src/ui/components/my-component/component.ts`
file.

To make this process fast, Glimmer generates a _resolution map_ when you build
your application. This resolution map allows the resolver to quickly locate the
requested object.

### Specifiers

Internally, Glimmer uses _specifiers_ to identify objects in the system. A
specifier is a specially-formatted string that encodes the _type_ and _path_ of
an object.

For example, the specifier for the `text-editor` component's template in an app might be:

```js
"template:/my-app/components/text-editor"
```

In addition to the type of object (component, template, route, etc.), a
specifier's path includes information about the root name (an app or an addon),
collection, and namespace.

### Generated Source

This package can generate the source code for a JavaScript module that imports
the files in your app and includes them in a resolution map object. For example:

```js
import { default as __ui_components_my_app_component__ } from '../ui/components/my-app/component';
import { default as __ui_components_my_app_page_banner_component__ } from '../ui/components/my-app/page-banner/component';
import { default as __ui_components_my_app_page_banner_template__ } from '../ui/components/my-app/page-banner/template';
import { default as __ui_components_my_app_page_banner_titleize__ } from '../ui/components/my-app/page-banner/titleize';
import { default as __ui_components_my_app_template__ } from '../ui/components/my-app/template';
export default {'component:/my-app/components/my-app': __ui_components_my_app_component__,'component:/my-app/components/my-app/page-banner': __ui_components_my_app_page_banner_component__,'template:/my-app/components/my-app/page-banner': __ui_components_my_app_page_banner_template__,'component:/my-app/components/my-app/page-banner/titleize': __ui_components_my_app_page_banner_titleize__,'template:/my-app/components/my-app': __ui_components_my_app_template__};
```

## Usage

### Broccoli Plugin

If using as a Broccoli plugin, instantiate the plugin with two input trees:

1. The `src` directory
2. The `config` directory

```js
const ResolutionMapBuilder = require('@glimmer/resolution-map-builder');
return new ResolutionMapBuilder(srcTree, configTree, {
  srcDir: 'src',
  defaultModulePrefix: this.name,
  defaultModuleConfiguration
});
```

The Broccoli plugin will read the module prefix and module configuration from
the `configTree`. If none are found, you can still provide fallback
configurations with the `defaultModulePrefix` and `defaultModuleConfiguration`
options.

### Utilities

If you want to generate your own resolution map without using Broccoli, this
package includes several helper functions you can use.

#### `buildResolutionMapSource()`

Returns a string of generated JavaScript that imports each module and has a default export of
an object with specifiers as keys and each module's default export as its value.

```js
const { buildResolutionMapSource } = require('@glimmer/resolution-map-builder');
let moduleConfig = {
  types: {
    application: { definitiveCollection: 'main' },
    component: { definitiveCollection: 'components' },
    helper: { definitiveCollection: 'components' },
    renderer: { definitiveCollection: 'main' },
    template: { definitiveCollection: 'components' }
  },
  collections: {
    main: {
      types: ['application', 'renderer']
    },
    components: {
      group: 'ui',
      types: ['component', 'template', 'helper'],
      defaultType: 'component',
      privateCollections: ['utils']
    },
    styles: {
      group: 'ui',
      unresolvable: true
    },
    utils: {
      unresolvable: true
    }
  }
};

let contents = buildResolutionMapSource({
  projectDir: 'path/to/app',
  srcDir: 'src',
  modulePrefix: 'my-app',
  moduleConfig
});
// returns
// `import { default as __ui_components_my_app_component_ts__ } from '../ui/components/my-app/component.ts';
// export default { 'component:/my-app/components/my-app': __ui_components_my_app_component_ts__ };`

fs.writeFileSync('config/module-map.js', contents, { encoding: 'utf8' });
```

#### `buildResolutionMapTypeDefinitions()`

Returns a string of TypeScript source code that provides type information for
the resolution map generated by `buildResolutionMapSource()`. This source can be
included in a `.d.ts` file with the same name as the resolution map to avoid
TypeScript errors at compilation time.

```js
const { buildResolutionMapTypeDefinitions } = require('@glimmer/resolution-map-builder');

let types = buildResolutionMapTypeDefinitions();
fs.writeFileSync('config/module-map.d.ts', types, { encoding: 'utf8' });
```

#### `buildResolutionMap()`

Similar to `buildResolutionMapSource()` (and takes the same arguments), but
allows you to generate the JavaScript output yourself. Instead of returning
JavaScript source, `buildResolutionMap()` returns an object with module
specifiers as the keys and the _path_ to the module (relative to `projectDir`)
as the value.

```js
const { buildResolutionMap } = require('@glimmer/resolution-map-builder');

let map = buildResolutionMap({
  projectDir: 'path/to/app',
  srcDir: 'src',
  modulePrefix: 'my-app',
  moduleConfig
});

// returns {
//   'component:/my-app/components/my-app': 'src/ui/components/my-app/component'
// }
```

## Acknowledgements

Thanks to [Monegraph](http://monegraph.com) and
[Cerebris](http://www.cerebris.com) for funding the initial development of this
library.

## License

MIT License.
