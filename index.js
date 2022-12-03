import { relative, basename } from "path";
import { readFile } from "fs/promises";
import { parse } from 'postcss';
import { createHash } from "crypto";

let NAMESPACE = 'css';

/**
 * @typedef {(node: import('postcss').Rule, path: string, content: string) => string} TransformClassFn
 */

/**
 * @typedef {object} CSSModulesOptions
 * @property {number?} hashLength Defaults to 7. Max-length of 28. Hashes are generated using SHA-1 internally.
 * @property {string?} prefix An optional prefix to prepend to every generated class.
 * @property {TransformClassFn?} transformClassName
 */

/**
 * @param {CSSModulesOptions} options
 * @param {string} path
 * @returns {Promise<{ css: string, styles: Record<string, string>, importNS: string }>}
 */
async function transform(options, path) {
    let content = await readFile(path),
        moduleName = basename(path).split('.')[0],
        relativePath = relative(process.cwd(), path),
        importNS = path.replace(/(\/|\\)/g, "/").replace(/\./g, ".") + ' ',
        ast = parse(content),
        styles = {},
        hashLength = options.hashLength || 7,
        prefix = options.prefix || '',
        hash = p => createHash('sha1').update(p).digest('base64').slice(0, hashLength),
        transformClassName = options.transformClassName ||
            (node => `${prefix}${moduleName}_${node.selector.replace(/[\.#]/g, "")}--${hash(relativePath)}`);

    ast.walkRules(/^\.\S+$/, (node) => {
        let selector = node.selector.slice(1);
        styles[selector] = transformClassName(node, path, content);
        node.selector = `.${styles[selector]}`;
    });

    return {
        css: ast.toResult().css,
        styles,
        importNS
    };
}

/**
 * @param {CSSModulesOptions} options
 */
export default (options = {}) => ({
    name: "esbuild-plugin-cssm",
    async setup(build) {
        let cssContents = new Map();

        // match paths ending in .module.css
        build.onLoad({ filter: /\.module.css$/ }, async args => {
            let { css, styles, importNS } = await transform(options, args.path);
            let importPath = `module://${importNS}`;
            cssContents.set(importPath, css);

            return {
                contents: `import "${importPath}";\n` + `export default ${JSON.stringify(styles)}`
            };
        });

        // match paths beginning with module://
        build.onResolve({ filter: /^module:\/\// }, args => {
            return {
                path: args.path,
                namespace: NAMESPACE,
            };
        });

        build.onLoad({ filter: /.*/, namespace: NAMESPACE }, args => {
            return {
                contents: cssContents.get(args.path),
                loader: 'css'
            };
        });
    },
});
