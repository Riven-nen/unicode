import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { registerMainPanel, setUser, getUser } from './state';

let unicodePanel: vscode.WebviewPanel | undefined;

export function createUnicodeWebview(context: vscode.ExtensionContext) {
    if (unicodePanel) {
        unicodePanel.reveal(vscode.ViewColumn.One);
        return unicodePanel;
    }

    unicodePanel = vscode.window.createWebviewPanel(
        'unicode-main',
        'Unicode',
        vscode.ViewColumn.One,
        { enableScripts: true }
    );

    registerMainPanel(unicodePanel);

    const assetsUri = unicodePanel.webview.asWebviewUri(
        vscode.Uri.joinPath(context.extensionUri, 'media', 'webview', 'assets')
    );

    const htmlPath = path.join(
        context.extensionPath,
        'media', 'webview', 'main', 'index.html'
    );

    let html = fs.readFileSync(htmlPath, 'utf-8');
    html = html.replaceAll('/assets/', `${assetsUri.toString()}/`);
    unicodePanel.webview.html = html;

    const panel = unicodePanel;

    panel.webview.onDidReceiveMessage(message => {
        if (message.type === 'loginSuccess') {
            setUser(message.user); // broadcasts to both webviews
        }
    });

    panel.onDidDispose(() => {
        registerMainPanel(undefined);
        unicodePanel = undefined;
    });

    return unicodePanel;
}