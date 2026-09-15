import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

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
        {
            enableScripts: true
        }
    );

    const assetsUri = unicodePanel.webview.asWebviewUri(
        vscode.Uri.joinPath(
            context.extensionUri,
            'media',
            'webview',
            'assets'
        )
    );

    const htmlPath = path.join(
        context.extensionPath,
        'media',
        'webview',
        'main',
        'index.html'
    );

    let html = fs.readFileSync(htmlPath, 'utf-8');

    html = html.replaceAll(
        '/assets/',
        `${assetsUri.toString()}/`
    );

    unicodePanel.webview.html = html;

    unicodePanel.onDidDispose(() => {
        unicodePanel = undefined;
    });

    return unicodePanel;
}