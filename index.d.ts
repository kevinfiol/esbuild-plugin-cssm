type SelectorTransformer = (
    selectorName: string,
    node: import('postcss').Rule,
    path: string,
    content: string
) => string;

type CSSModulesOptions = {
    /** Defaults to 6. Max-length of 28. Hashes are generated using SHA-1 internally. */
    hashLength?: number;

    /** An optional prefix to prepend to every generated selector. */
    prefix?: string;

    /**
     * Define a custom selector transformer.
     * This will be run on individual ids, classes, and animation names defined with @keyframes
     * Note: returned strings are automatically prefixed with '#' or '.'
     */
    transformSelector?: SelectorTransformer;
};

declare module 'esbuild-plugin-cssm' {
    function ESBuildPluginCSSM(options: CSSModulesOptions): {
        name: string;
        setup: (build: import('esbuild').BuildOptions) => Promise<void>
    };

    export default ESBuildPluginCSSM;
}
