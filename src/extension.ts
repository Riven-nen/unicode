import * as vscode from 'vscode';
import { UnicodeViewProvider } from './unicodeSidebar';
import { createUnicodeWebview } from './unicodeMain';

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
			vscode.window.showInformationMessage("get Started ran");
			createUnicodeWebview(context);
		}
	);

	

	context.subscriptions.push(disposable);
}

export function deactivate() {}
