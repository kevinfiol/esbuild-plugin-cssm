# Why another css-modules plugin?
Because I find the currently available plugins for css-modules quite convoluted and frankly slow because they utilize intermediate writes of the transformed css.

This plugin does not need intermediate writes and should thus be faster. Also it's quite a lot less code and less dependencies.

# API
```
import * as Esbuild from "esbuild"
import cssmodules from "esbuild-plugin-simple-css-plugin"

Esbuild.build({
  /* some build config */
	plugins: [cssmodules({
		transformClassName: (node) => {
			// node is an AST node, described here https://github.com/csstree/csstree/blob/bf05b963f85a08541c2991fa369f5bb613096db2/docs/ast.md
			return "my custom classname";
		}
	})},]
})
```
