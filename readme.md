# esbuild-plugin-cssm

A minimal [CSS Modules](https://github.com/css-modules/css-modules) plugin. Fork of [esbuild-plugin-simple-css-modules](https://gitlab.com/hesxenon/esbuild-plugin-simple-css-modules) by [Katja Potensky](https://gitlab.com/hesxenon). Like the original plugin, the only dependency is on PostCSS (which itself has a [small dependency graph](https://npmgraph.js.org/?q=postcss)).

This fork makes some superficial changes to the sourcemap paths, as well as adds a hash of the filepath to CSS classes by default.

# Usage
```js
import { build } from 'esbuild';
import cssModules from 'esbuild-plugin-cssm';

build({
  // ... the rest of your config
  plugins: [
    cssModules({
      // Length of hash string that will be appended to CSS classes.
      // Defaults to 7. Max-length of 28. Hashes are generated using SHA-1 internally.
      hashLength: 7,

      // An optional prefix to prepend to every generated class.
      prefix: '',

      // Alternatively, define a custom class generator.
      // @param {PostCSS.Rule} node
      // @param {string} path
      // @param {string} content
      // @returns {string} className
      transformClassName: (node, path, content) => {
        // contrived example
        return 'myprefix' + node.selector + myCoolHasher(path);
      }
    })
  ]
});
```
