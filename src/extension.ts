import * as vscode from 'vscode';
import { UnicodeViewProvider } from './unicodeSidebar';
import { createUnicodeWebview } from './unicodeMain';
import { setUser, getUser, initUser } from './state'; 

export function activate(context: vscode.ExtensionContext) {
	// Load globalState user into runtime memory first in state.ts
	initUser(context);
	console.log('[unicode] user on activation:', getUser());

	const unicodeViewProvider = new UnicodeViewProvider(context);

	vscode.window.registerWebviewViewProvider(
		'unicode-main',
		unicodeViewProvider
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('unicode.startWebview', () => {
			createUnicodeWebview(context);
		}
	));

	context.subscriptions.push(
		vscode.commands.registerCommand('unicode.fakeLogin', async () => {
			await setUser(
				{ name : "User", role : "Student", userId : 1},
				context
			);
		}
	));

	context.subscriptions.push(
		vscode.commands.registerCommand('unicode.logout', async () => {
			await setUser(null, context);
		})
	);

	
}

export function deactivate() {}
