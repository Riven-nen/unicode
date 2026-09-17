import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { registerSidebar, setUser, getUser } from './state';

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
            if (message.type === 'getStarted') {
                vscode.commands.executeCommand('unicode.getStarted');
            }
            if (message.type === 'ready') {
                webviewView.webview.postMessage({
                    type: 'authState',
                    user: getUser()
                });
            }
        });

        webviewView.onDidDispose(() => {
            registerSidebar(undefined);
        });
    }
}