import * as vscode from 'vscode';
import { UnicodeViewProvider } from './unicodeView';
import { createUnicodeWebview } from './unicodePanel';

export function activate(context: vscode.ExtensionContext) {

	const unicodeViewProvider = new UnicodeViewProvider(context);

	vscode.window.registerWebviewViewProvider(
		'unicode-main',
		unicodeViewProvider
	);

	console.log('Congratulations, your extension "unicode" is now active!');

	const disposable = vscode.commands.registerCommand(
		'unicode.getStarted', 
		() => {
			createUnicodeWebview(context);
		}
	);

	

	context.subscriptions.push(disposable);
}

export function deactivate() {}
