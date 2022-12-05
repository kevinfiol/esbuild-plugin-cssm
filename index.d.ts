type SelectorTransformer = (
    selectorName: string,
    node: import('postcss').Rule,
    path: string,
    content: string
) => string;

type CSSModulesOptions = {
    hashLength?: number;
    prefix?: string;
    transformSelector?: SelectorTransformer;
};

declare module 'esbuild-plugin-cssm' {
    function ESBuildPluginCSSM(options: CSSModulesOptions): {
        name: string;
        setup: (build: import('esbuild').BuildOptions) => Promise<void>
    };

    export default ESBuildPluginCSSM;
}
