import type * as Esbuild from "esbuild";
import * as Path from "path";
import * as PostCss from "postcss";
import { readFile } from "fs/promises";

export type options = {
  transformClassName?: (args: {
    path: string;
    content: string;
    rule: PostCss.Rule;
  }) => string;
};

/**
 * @param options - an object like `Options` (explained below)
 *
 * ```typescript
 * type Options = {
 *   transformClassName?: (args: {path: string, content: string}) => string
 * }
 * ```
 *
 */
export default (options: options = {}): Esbuild.Plugin => ({
  name: "simple-css-modules",
  async setup(build) {
    const transform = async (path: string) => {
      const content = (await readFile(path)).toString();
      const ast = PostCss.parse(content);
      const styles: Record<string, string> = {};

      const namespace = Path.relative(process.cwd(), path)
        .replace(/\//g, "__")
        .replace(/\./g, "_");

      const transformClassName =
        options.transformClassName ??
        (({ rule }) => `${namespace}--${rule.selector.replace(/\./g, "")}`);

      ast.walkRules((node) => {
        const selector = node.selector.slice(1); // assume primitive selectors
        styles[selector] = transformClassName({
          path,
          content,
          rule: node,
        });
        node.selector = `.${styles[selector]}`;
      });

      const css = ast.toResult().css;

      return {
        namespace,
        styles,
        css,
      };
    };

    const cssContents = new Map();

    build.onLoad({ filter: /\.module.css/ }, async (args) => {
      const { css, styles, namespace } = await transform(args.path);

      const importPath = `css-module://${namespace}`;

      cssContents.set(importPath, css);

      return {
        contents: `import "${importPath}";
export default ${JSON.stringify(styles)}
`,
      };
    });

    build.onResolve({ filter: /^css-module:\/\// }, (args) => ({
      path: args.path,
      namespace: "css-module",
    }));

    build.onLoad({ filter: /.*/, namespace: "css-module" }, (args) => {
      const css = cssContents.get(args.path);

      return { contents: css, loader: "css" };
    });
  },
});
