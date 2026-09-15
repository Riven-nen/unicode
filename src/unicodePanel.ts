import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function createUnicodeWebview(context : vscode.ExtensionContext) {
    const stylePath = vscode.Uri.joinPath(
        context.extensionUri,
        'media',
        'css',
        'index.css'
    );

    const panel = vscode.window.createWebviewPanel(
        'unicode-main',
        'Unicode',
        vscode.ViewColumn.One,
        {}
    );

    const htmlPath = path.join(
        context.extensionPath,
        'media',
        'html',
        'index.html'
    );

    const html = fs.readFileSync(htmlPath, 'utf-8');
    html.replace("STYLE_URI","");

    panel.webview.html = html;

    return panel;
}