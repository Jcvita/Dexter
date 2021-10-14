"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const codex_1 = require("./codex");
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    let codex;
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "dexter" is now active!');
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(cfg => {
        const config = vscode.workspace.getConfiguration('dexter');
        if (cfg.affectsConfiguration("dexter.apiKey")) {
            codex = new codex_1.Codex(config.get('apiKey', ''));
        }
        if (cfg.affectsConfiguration("dexter.engine")) {
            codex.setEngine(config.get("dexter.engine", ""));
        }
        if (cfg.affectsConfiguration("dexter.responseLength")) {
            codex.setResLength(config.get("dexter.responseLength", 64));
        }
        if (cfg.affectsConfiguration("dexter.temperature")) {
            codex.setTemp(config.get("dexter.temperature", 0));
        }
        if (cfg.affectsConfiguration("dexter.topP")) {
            codex.setTopp(config.get("dexter.topP", 1));
        }
        if (cfg.affectsConfiguration("dexter.frequencyPenalty")) {
            codex.setFreqPenalty(config.get("dexter.frequencyPenalty", 0));
        }
        if (cfg.affectsConfiguration("dexter.presencePenalty")) {
            codex.setPresPenalty(config.get("dexter.presencePenalty", 0));
        }
        if (cfg.affectsConfiguration("dexter.bestOf")) {
            codex.setBestOf(config.get("dexter.bestOf", 1));
        }
        if (cfg.affectsConfiguration("dexter.stopSequences")) {
            codex.setStopSequences(config.get("dexter.stopSequences", ""));
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('dexter.addCodexContext', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage("No open editor");
        }
        else {
            var selections = editor.selections;
            selections.forEach((selection, index) => {
                const text = editor.document.getText(selection);
                if (text.length > 0) {
                    codex.addContext(text);
                }
                else {
                    selections.splice(index, 1);
                    return;
                }
            });
            // vscode.window.showInformationMessage(`Added ${selections.length} ${selections.length === 1 ? 'line' : 'lines'}. Total: ${codex.getContext().split('\n')}`)
            vscode.window.showInformationMessage(`Added context from ${selections.length} selections`);
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('dexter.clearCodex', () => {
        codex.clearContext();
        codex.clearQuery();
        codex.clearStopSequences();
    }));
    function appendText(text) {
        vscode.commands.registerTextEditorCommand('dexter.insertText', function (editor, edit, args) {
            edit.insert(editor.selection.end, text);
        });
    }
    function replaceText(text) {
        vscode.commands.registerTextEditorCommand('dexter.insertText', function (editor, edit, args) {
            edit.replace(editor.selection.end, text);
        });
    }
    context.subscriptions.push(vscode.commands.registerCommand('dexter.runCodeCompletion', () => {
        const key = vscode.workspace.getConfiguration('dexter').get('apiKey', false);
        if (!key) {
            vscode.window.showErrorMessage('API key must be specified in the extension settings');
        }
        else {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showInformationMessage("No open editor");
            }
            else {
                const selections = editor.selections;
                const replaceHighlight = vscode.workspace.getConfiguration('dexter').get('replaceHighlight');
                const sameCompletion = vscode.workspace.getConfiguration('dexter').get('sameCompletion');
                var insertText = replaceHighlight ? appendText : replaceText;
                //append if one or more selections contain characters
                var appendResult = !selections.every((value) => { return value.isEmpty; });
                codex.complete(appendResult).then(result => {
                    selections.forEach((selection, index) => {
                        codex.addQuery(editor.document.getText(selection));
                        if (index === 0 || sameCompletion) {
                            insertText(result);
                        }
                        else {
                            codex.complete(appendResult).then(result => {
                                insertText(result);
                            });
                        }
                    });
                    return;
                });
            }
        }
    }));
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map