// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import internal = require('stream');
import * as vscode from 'vscode';
import { Codex } from './codex';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	let codex: Codex = new Codex();
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	
	
	console.log('Congratulations, your extension "dexter" is now active!');
	
	const config = vscode.workspace.getConfiguration('dexter');
	console.log("api key: " + config.get('apiKey', ''))
	codex.insertAPIKey(config.get('apiKey', ''));
	codex.setStopSequences(config.get("stopSequences", ""));
	codex.setBestOf(config.get("bestOf", "1")); //this is a string because of a weird glitch that is causing it to pass as a string to the request. conversion fixes it???
	codex.setPresPenalty(config.get("presencePenalty", 0));
	codex.setFreqPenalty(config.get("frequencyPenalty", 0));
	codex.setTopp(config.get("topP", 1));
	codex.setTemp(config.get("temperature", 0));
	codex.setResLength(config.get("responseLength", 64));
	codex.setEngine(config.get("engine", ""));

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json

	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(cfg => {
		//use else ifs if each change is recorded individually. if multiple changes occur at once, uses ifs
		const config = vscode.workspace.getConfiguration('dexter');
		if (cfg.affectsConfiguration("dexter.apiKey")) {
			codex.insertAPIKey(config.get('apiKey', ''));
			// codex.setStopSequences(config.get("stopSequences", ""));
			// codex.setBestOf(config.get("bestOf", 1));
			// codex.setPresPenalty(config.get("presencePenalty", 0));
			// codex.setFreqPenalty(config.get("frequencyPenalty", 0));
			// codex.setTopp(config.get("topP", 1));
			// codex.setTemp(config.get("temperature", 0));
			// codex.setResLength(config.get("responseLength", 64));
			// codex.setEngine(config.get("engine", ""));
		}
		if (cfg.affectsConfiguration("dexter.engine")) {
			codex.setEngine(config.get("engine", ""));
		}
		if (cfg.affectsConfiguration("dexter.responseLength")) {
			codex.setResLength(config.get("responseLength", 64));
		}
		if (cfg.affectsConfiguration("dexter.temperature")) {
			codex.setTemp(config.get("temperature", 0));
		}
		if (cfg.affectsConfiguration("dexter.topP")) {
			codex.setTopp(config.get("topP", 1));
		}
		if (cfg.affectsConfiguration("dexter.frequencyPenalty")) {
			codex.setFreqPenalty(config.get("frequencyPenalty", 0));
		}
		if (cfg.affectsConfiguration("dexter.presencePenalty")) {
			codex.setPresPenalty(config.get("presencePenalty", 0));
		}
		if (cfg.affectsConfiguration("dexter.bestOf")) {
			codex.setBestOf(config.get("bestOf", "1"));
		}
		if (cfg.affectsConfiguration("dexter.stopSequences")) {
			codex.setStopSequences(config.get("stopSequences", ""));
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
				vscode.window.showInformationMessage(`Added context from ${selections.length} selections`);
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('dexter.clearCodex', () => {
			codex.clearContext();
			codex.clearQueries();
			codex.clearStopSequences();
		})
	);

	function appendTextAfterLine(text: string, selection: vscode.Selection) {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const currentLine = editor.document.lineAt(selection.start.line);
			editor.edit(edit => {
				edit.insert(currentLine.range.end, '\n');
				edit.insert(currentLine.range.start.translate(1), text);
			});
		}
	}

	function replaceTextAtSelection(text: string, selection: vscode.Selection) {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			editor.edit(edit => {
				edit.replace(selection.active, text);
			});
		}
	}

	//TODO hide api key from this 
	context.subscriptions.push(
		vscode.commands.registerCommand('dexter.showCodexContext', () => {
			vscode.window.showInformationMessage(`API Key: ${codex.getAPIKey()}`);
			vscode.window.showInformationMessage(`Response Length: ${codex.getResLength()} \nTemperature: ${codex.getTemp()} \nTop P: ${codex.getTopp()} \nFrequency Penalty: ${codex.getFreqPenalty()} \nPresence Penalty: ${codex.getPresPenalty()} \n Best of: ${codex.bestOf} \nStop Sequences: ${codex.getStopSequences().join(',')}`);
			vscode.window.showInformationMessage(codex.getContext());
		})
	);

	//TODO this doesn't work
	context.subscriptions.push(
		vscode.commands.registerCommand('dexter.runCodeCompletion', async () => {
			const key = vscode.workspace.getConfiguration('dexter').get('apiKey', false);
			if (!key) {
				await vscode.window.showInputBox({
					title: "Set the OpenAI API key"
				}).then(input => {
					vscode.workspace.getConfiguration('dexter').update('apiKey', input);	
				});
			} else {
				const editor = vscode.window.activeTextEditor;
				if (!editor) {
					vscode.window.showInformationMessage("No open editor");
				} else {
					const selections = editor.selections;
					const sameCompletion = vscode.workspace.getConfiguration('dexter').get('sameCompletion');

					await codex.complete().then(result => {
						console.log("Completion Results:")
						console.log(result)
						if (result.includes('UNAUTHORIZED')){ //displayed if no output is generated (complete returns empty list)
							vscode.window.showErrorMessage('Bad API key');
						} else if (result.includes('ERROR')) {
							vscode.window.showInformationMessage('One or more errors occurred ');
						}
						selections.sort((a, b) => { return a.active.compareTo(b.active); })
						.reverse().forEach((selection, index) => {
							codex.addQuery(editor.document.getText(selection));
							if (index === 0 || sameCompletion) {
								//result should ALWAYS be the same length as selections
								appendTextAfterLine(result[index] || '', selection);
							} else {
								codex.complete().then(result => {
									appendTextAfterLine(result[index] || '', selection);
								});
							}
						});
						return;
					});
				}
			}
		})
	);

	// BUT THIS DOES WORK HYPEEE. make an indication that it is thinking and tell the user not to move the cursor
	context.subscriptions.push(
		vscode.commands.registerCommand('dexter.insertCodeCompletion', async () => {
			const key = vscode.workspace.getConfiguration('dexter').get('apiKey', false);
			if (!key) {
				await vscode.window.showInputBox({
					title: "Set the OpenAI API key"
				}).then(input => {
					vscode.workspace.getConfiguration('dexter').update('apiKey', input);	
				});
			} else {
				const editor = vscode.window.activeTextEditor;
				if (!editor) {
					vscode.window.showInformationMessage("No open editor");
				} else {
					const selections = editor.selections;
					const sameCompletion = vscode.workspace.getConfiguration('dexter').get('sameCompletion');

					await vscode.window.showInputBox({
						title: "Set the query",
						placeHolder: editor.document.getText(selections[0]),
						ignoreFocusOut: true
					}).then(input => { codex.addQuery(input || ''); });

					await codex.complete().then(result => {
						if (result.includes('UNAUTHORIZED')){ //displayed if no output is generated (complete returns empty list)
							vscode.window.showErrorMessage('Bad API key');
						} else if (result.includes('ERROR')) {
							vscode.window.showInformationMessage('One or more errors occurred ');
						}
						selections.sort((a, b) => { return a.active.compareTo(b.active); })
						.reverse().forEach((selection, index) => {
							if (index === 0 || sameCompletion) {
								//result should ALWAYS be the same length as selections
								replaceTextAtSelection(result[index] || '', selection);
							} else {
								codex.complete().then(result => {
									replaceTextAtSelection(result[index] || '', selection);
								});
							}
						});
						return;
					});
				}
			}
		})
	);
	context.subscriptions.push(
		vscode.commands.registerCommand('dexter.setCodexResLength', async () => {
			await vscode.window.showInputBox({
				title: "Set the max number of tokens for codex to output (1-4096)",
				placeHolder: "64",
				validateInput: text => {
					const num = +text;
					if (num > 0 && num < 4097) {
						return text;
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

	//TODO this doesn't work
	context.subscriptions.push(
		vscode.commands.registerCommand('dexter.setStopSequences', async () => {
			await vscode.window.showInputBox({
				title: "Up to 4 sequences (separated by /|. represent newline as ???) that the model will end the output at.",
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