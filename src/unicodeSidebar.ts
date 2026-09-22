import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { registerSidebar, getUser } from './state';

export class UnicodeViewProvider implements vscode.WebviewViewProvider {
    constructor(private readonly context: vscode.ExtensionContext) {}

    resolveWebviewView(webviewView: vscode.WebviewView) {
        registerSidebar(webviewView);

        webviewView.webview.options = { enableScripts: true };

        const assetsUri = webviewView.webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'media', 'webview', 'assets')
        );

        const htmlPath = path.join(
            this.context.extensionPath,
            'media', 'webview', 'sidebar', 'index.html'
        );

        let html = fs.readFileSync(htmlPath, 'utf-8');
        html = html.replaceAll('/assets/', `${assetsUri.toString()}/`);
        webviewView.webview.html = html;

        webviewView.webview.onDidReceiveMessage(message => {
            if (message.type === 'startWebview') {
                vscode.commands.executeCommand('unicode.startWebview');
            }
            if (message.type === 'ready') {
                console.log('[unicode] replying with user:', getUser());
                webviewView.webview.postMessage({
                    type: 'authState',
                    user: getUser()
                });
            }
            if (message.type === 'logout') {
                vscode.commands.executeCommand('unicode.logout');
            }
        });

        webviewView.onDidDispose(() => {
            registerSidebar(undefined);
        });
    }
}