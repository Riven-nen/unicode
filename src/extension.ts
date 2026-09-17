import * as vscode from 'vscode';
import { UnicodeViewProvider } from './unicodeSidebar';
import { createUnicodeWebview } from './unicodeMain';

export function activate(context: vscode.ExtensionContext) {

	const unicodeViewProvider = new UnicodeViewProvider(context);

	vscode.window.registerWebviewViewProvider(
		'unicode-main',
		unicodeViewProvider
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('unicode.getStarted', () => {
			createUnicodeWebview(context);
		}
	));

	
}

export function deactivate() {}
