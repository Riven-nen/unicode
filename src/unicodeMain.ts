import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function createUnicodeWebview(context : vscode.ExtensionContext) {

    const panel = vscode.window.createWebviewPanel(
        'unicode-main',
        'Unicode',
        vscode.ViewColumn.One,
        {}
    );

    const assetsUri = panel.webview.asWebviewUri(
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
    html = html.replace("/assets/", `${assetsUri.toString()}/`);

    panel.webview.html = html;

    return panel;
}