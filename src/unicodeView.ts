import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class UnicodeViewProvider implements vscode.WebviewViewProvider {

    constructor(
        private readonly context : vscode.ExtensionContext
    ) {}
    // hardcoded for now because i dont think i will reuse this?
    resolveWebviewView(webviewView: vscode.WebviewView) {
        const scriptUri = webviewView.webview.asWebviewUri(
            vscode.Uri.joinPath(
                this.context.extensionUri,
                'media',
                'js',
                'webviewView.js'
            )        
        );

        webviewView.webview.options = {
            enableScripts: true
        };

        const htmlPath = path.join(
            this.context.extensionPath,
            'media',
            'html',
            'webviewView.html'
        );

        let html = fs.readFileSync(htmlPath, 'utf-8');

        html = html.replace("SCRIPT_URI", scriptUri.toString());

        webviewView.webview.html = html;

        webviewView.webview.onDidReceiveMessage(message => {
            if (message.type === "getStarted") {
                vscode.commands.executeCommand("unicode.getStarted");
            }
        });
    }
}