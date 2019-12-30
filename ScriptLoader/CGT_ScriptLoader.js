
/*:
    @plugindesc Adds utilities to the global namespace for loading scripts, so you can avoid having to write your plugins monolithically.
    @author CG-Tespy – https://github.com/CG-Tespy
    @help This is version 1.0 of this plugin. For RMMV versions 1.5.1 and above.

    Please make sure to credit me if you're using this plugin.
*/

'use strict';

var ScriptLoader = 
{
    LoadScript(sourceDir)
    {
        let sourceCode = this.GetScriptSourceCode(sourceDir);
        return this.ExecuteSourceCode(sourceCode);
    },

    GetScriptSourceCode(scriptSourceDir)
    {
        let request = new XMLHttpRequest();
        request.open('GET', scriptSourceDir, false);
        request.send();

        return request.responseText;
    },

    ExecuteSourceCode(sourceCode)
    {
        return eval(sourceCode);
    },

    LoadScriptAnon(sourceDir)
    {
        let sourceCode = this.GetScriptSourceCode(sourceDir);
        sourceCode = this.WrapInAnonymousScope(sourceCode);
        return this.ExecuteSourceCode(sourceCode);
    },

    WrapInAnonymousScope(code)
    {
        let scopeStart = "(function(){";
        let scopeEnd = "})();";
        return scopeStart + code + scopeEnd;
    },
};

function AltRequire(scriptPath)
{
    return ScriptLoader.LoadScript(scriptPath);
}

function AltRequireAnon(scriptPath)
{
    return ScriptLoader.LoadScriptAnon(scriptPath);
}

var pluginFolder = "/js/plugins/";