import { relative, basename } from "path";
import { readFile } from "fs/promises";
import { parse } from 'postcss';
import { createHash } from "crypto";

let NAMESPACE = 'css';

/**
 * @param {string} path
 * @param {number} length
 * @returns {string}
 */
function hash(path, length) {
    return createHash('sha1').update(path).digest('base64').slice(0, length);
}

async function transform(options, path) {
    let scoped = new Map(),
        content = await readFile(path),
        moduleName = basename(path).split('.')[0],
        importNS = path.replace(/(\/|\\)/g, "/").replace(/\./g, ".") + ' ',
        ast = parse(content),
        styles = {},
        hashLength = options.hashLength || 7,
        prefix = options.prefix || '',
        pathHash = hash(relative(process.cwd(), path), hashLength),
        transformSelector = options.transformSelector ||
            (x => `${prefix}${moduleName}--${pathHash}_${x}`);

    ast.walkAtRules(/keyframes/, node => {
        let selector = scoped.get(node.params);
        if (!selector)
            scoped.set(node.params, (selector = transformSelector(node.params, node, path, content)));
        node.params = selector;
    });

    ast.walkRules(/[\.#]\w+/, node => {
        let i = 0,
            selector = node.selector,
            decls = node.nodes,
            attrs = selector.match(/[\.#]\w+/g),
            sign,
            key,
            scopedSel;

        for (; i < attrs.length; i++) {
            sign = attrs[i][0];
            key = attrs[i].slice(1);
            scopedSel = scoped.get(attrs[i]);

            if (!scopedSel)
                scoped.set(attrs[i], (scopedSel = sign + transformSelector(attrs[i].replace(/[\.#]/g, ""), node, path, content)));

            if (sign === '.' && !styles[key])
                styles[key] = scopedSel;

            selector = selector.replace(new RegExp(`\\${attrs[i]}\\b`), scopedSel);
        }

        for (i = 0; i < decls.length; i++) {
            if (
                /animation-name/.test(decls[i].prop) ||
                /\banimation\b/.test(decls[i].prop)
            ) {
                for (let scopedSel, j = 0, values = decls[i].value.split(' '); j < values.length; j++)
                    if (scopedSel = scoped.get(values[j]))
                        decls[i].value = decls[i].value.replace(new RegExp(`\\b${values[j]}\\b`, 'g'), scopedSel);
            }
        }

        node.selector = selector;
        node.nodes = decls;
    });

    return {
        css: ast.toResult().css,
        styles,
        importNS
    };
}

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
