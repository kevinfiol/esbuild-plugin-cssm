# esbuild-plugin-cssm

A minimal [CSS Modules](https://github.com/css-modules/css-modules) plugin for [esbuild](https://github.com/evanw/esbuild). Fork of [esbuild-plugin-simple-css-modules](https://gitlab.com/hesxenon/esbuild-plugin-simple-css-modules) by [Katja Potensky](https://gitlab.com/hesxenon). Like the original plugin, the only dependency is PostCSS (which itself has a [small dependency graph](https://npmgraph.js.org/?q=postcss)).

Changes in this fork:
* `animation-name` support
* `id` attributes are scoped
* Selectors containing multiple class names or ids are now properly transformed
* Clearer sourcemap paths
* Transformed selectors are suffixed with a hash of the filepath by default

## Install

```bash
npm install --save-dev esbuild-plugin-cssm
```

## Usage

1. Setup
```js
import { build } from 'esbuild';
import cssm from 'esbuild-plugin-cssm';

build({
  // ... the rest of your config
  plugins: [
    cssm({
      // Optional. Length of hash string that will be appended to CSS classes.
      // Defaults to 7. Max-length of 28. Hashes are generated using SHA-1 internally.
      hashLength: 7,

      // Optional. A prefix to prepend to every generated selector.
      prefix: '',

      /**
       * Optional. Define a custom selector transformer.
       * This will be run on individual ids, classes, and animation names defined with @keyframes.
       * Note: returned strings are automatically prefixed with '#' or '.' where applicable.
       * 
       * @param {string} attr - The class, id, or animation name minus any prefixes (#, .)
       * @param {PostCSS.Rule} node - A PostCSS Rule object for the complete selector
       * @param {string} path - Path to the CSS Module
       * @param {string} contents - A string containing the contents of the CSS Module
       **/
      transformSelector: (attr, node, path, content) => {
        // contrived example
        return 'myprefix' + node.selector + myCoolHasher(path);
      }
    })
  ]
});
```

2. Define CSS in `.module.css` files
```css
/* Home.module.css */
.blue {
  color: blue;
}
```

3. Import the module
```jsx
// Home.js
import { h } from 'preact';
import styles from './Home.module.css';

export function Home() {
  return <div className={styles.blue}>This text is blue</div>
}
```

4. esbuild will generate scoped CSS
```css
/* bundle.css */
.Home_blue--tL5t7Tf {
  color: blue;
}
```
