// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { Codex } from './codex';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	let codex: Codex;
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	
	console.log('Congratulations, your extension "dexter" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json

	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(cfg => {
		//use else ifs if each change is recorded individually. if multiple changes occur at once, uses ifs
		const config = vscode.workspace.getConfiguration('dexter');
		if (cfg.affectsConfiguration("dexter.apiKey")) {
			codex = new Codex(config.get('apiKey', ''));
			codex.setStopSequences(config.get("dexter.stopSequences", ""));
			codex.setBestOf(config.get("dexter.bestOf", 1));
			codex.setPresPenalty(config.get("dexter.presencePenalty", 0));
			codex.setFreqPenalty(config.get("dexter.frequencyPenalty", 0));
			codex.setTopp(config.get("dexter.topP", 1));
			codex.setTemp(config.get("dexter.temperature", 0));
			codex.setResLength(config.get("dexter.responseLength", 64));
			codex.setEngine(config.get("dexter.engine", ""));
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

	context.subscriptions.push(
		vscode.commands.registerCommand('dexter.addCodexContext', () => {
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				vscode.window.showInformationMessage("No open editor");
			} else {
				var selections = editor.selections;
				selections.forEach((selection, index) => {
					const text = editor.document.getText(selection);
					if (text.length > 0) {
						codex.addContext(text);
					} else {
						selections.splice(index, 1);
						return;
					}
				});
				// vscode.window.showInformationMessage(`Added ${selections.length} ${selections.length === 1 ? 'line' : 'lines'}. Total: ${codex.getContext().split('\n')}`)
				vscode.window.showInformationMessage(`Added context from ${selections.length} selections`)
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('dexter.clearCodex', () => {
			codex.clearContext();
			codex.clearQueries();
			codex.clearStopSequences();
		})
	)

	function appendText(text: string) {
		vscode.commands.registerTextEditorCommand('dexter.insertText', function (editor, edit, args) {
			edit.insert(editor.selection.end, text)
		})
	}

	function replaceText(text: string) {
		vscode.commands.registerTextEditorCommand('dexter.insertText', function (editor, edit, args) {
			edit.replace(editor.selection.end, text)
		})
	} 

	context.subscriptions.push(
		vscode.commands.registerCommand('dexter.runCodeCompletion', async () => {
			const key = vscode.workspace.getConfiguration('dexter').get('apiKey', false);
			if (!key) {
				await vscode.window.showInputBox({
					title: "Set the OpenAI API key"
				}).then(input => {
					vscode.workspace.getConfiguration('dexter').update('apiKey', input);	
				})
			} else {
				const editor = vscode.window.activeTextEditor;
				if (!editor) {
					vscode.window.showInformationMessage("No open editor")
				} else {
					const selections = editor.selections;
					const replaceHighlight = vscode.workspace.getConfiguration('dexter').get('replaceHighlight');
					const sameCompletion = vscode.workspace.getConfiguration('dexter').get('sameCompletion');

					var insertText = replaceHighlight ? appendText : replaceText;
					//append if one or more selections contain characters
					var appendResult = !selections.every((value) => { return value.isEmpty; });
					
					await codex.complete().then(result => {
						if (result.includes('UNAUTHORIZED')){ //displayed if no output is generated (complete returns empty list)
							vscode.window.showErrorMessage('Bad API key');
						} else if (result.includes('ERROR')) {
							vscode.window.showInformationMessage('One or more errors occurred ')
						}
						selections.sort((a, b) => { 
							return a.active.compareTo(b.active);
						}).reverse().forEach((selection, index) => {
							codex.addQuery(editor.document.getText(selection));
							if (index === 0 || sameCompletion) {
								//result should ALWAYS be the same length as selections
								insertText(result[index]);
							} else {
								codex.complete().then(result => {
									insertText(result[index]);
								})
							}
						})
						return;
					});
				}
			}
		})
	);
//const line = editor.document.lineAt(selection.start.line).text;
	context.subscriptions.push(
		vscode.commands.registerCommand('dexter.setCodexResLength', async () => {
			await vscode.window.showInputBox({
				title: "Set the max number of tokens for codex to output (1-4096)",
				placeHolder: "64",
				validateInput: text => {
					const num = +text;
					if (num > 0 && num < 4097) {
						return text
					}
				}
			}).then(input => {
				if (input) {
					vscode.workspace.getConfiguration('dexter').update('responseLength', +input);
				} else {
					vscode.window.showErrorMessage("Response length must be a number"); 
				}
			});
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('dexter.setStopSequences', async () => {
			await vscode.window.showInputBox({
				title: "Up to 4 sequences (separated by /|. represent newline as ↵) that the model will end the output at.",
				placeHolder: ""
			}).then(input => {
				if (input) {
					vscode.workspace.getConfiguration('dexter').update('stopSequences', input);
				} else {
					vscode.workspace.getConfiguration('dexter').update('stopSequences', undefined);
				}
			});
		})
	);
}



// this method is called when your extension is deactivated
export function deactivate() {}
