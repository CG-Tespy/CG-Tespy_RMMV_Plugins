let ScriptLoader:
{
    LoadScript(sourceDir: string): string,
    LoadScriptAnon(sourceDir: string): string,
};

/**
 * Synchronously loads the plugin file at the given path.
 * @param path Relative to the project's index.html file.
 * @returns The result of calling eval() on the source code.
 */
declare function AltRequire(path: string): any;

/**
 * Synchronously loads the plugin file at the given path, having it executed in an
 * anonymous namespace.
 * @param path Relative to the project's index.html file.
 * @returns The result of calling eval() on the source code.
 */
declare function AltRequireAnon(sourceDir: string): any;

/**
 * Path to the plugin folder, relative to the project's index.html file's path.
 */
let pluginFolder = "/js/plugins/";