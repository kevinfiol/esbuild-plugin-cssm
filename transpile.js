// converts ESM source to CJS
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';

if (!existsSync('./dist')) mkdirSync('./dist');
const src = readFileSync('./index.js', 'utf8');
writeFileSync('./dist/esbuild-plugin-cssm.cjs', transpile(src));

// adapted from https://github.com/porsager/postgres/blob/master/transpile.cjs
function transpile(x) {
    return x.replace(/export default function ([^(]+)/, 'module.exports = $1;function $1')
        .replace(/export class ([a-z0-9_$]+)/gi, 'const $1 = module.exports.$1 = class $1')
        .replace(/export default /, 'module.exports = ')
        .replace(/export {/g, 'module.exports = {')
        .replace(/export const ([a-z0-9_$]+)/gi, 'const $1 = module.exports.$1')
        .replace(/export function ([a-z0-9_$]+)/gi, 'module.exports.$1 = $1;function $1')
        .replace(/export async function ([a-z0-9_$]+)/gi, 'module.exports.$1 = $1;async function $1')
        .replace(/import {([^{}]*?)} from (['"].*?['"])/gi, 'const {$1} = require($2)')
        .replace(/import (.*?) from (['"].*?['"])/gi, 'const $1 = require($2)')
        .replace(/import (['"].*?['"])/gi, 'require($1)')
        .replace('new URL(x, import.meta.url)', 'require("path").join(__dirname, x)');
}
