import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { registerMainPanel, getUser, getCurrentCourse, getCoursework } from './state';
import { openAssignmentInWorkspace } from './workspace';

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

    panel.webview.onDidReceiveMessage(async (message) => {
        if (message.type === 'login') {
            vscode.commands.executeCommand('unicode.login');
        }
        if (message.type === 'ready') {
            panel.webview.postMessage({
                type: 'authState',
                user: getUser()
            });
            panel.webview.postMessage({
                type: 'currentCourse',
                course: getCurrentCourse()
            });
            panel.webview.postMessage({
                type: 'coursework',
                coursework: getCoursework()
            });
        }
        if (message.type === 'openExternal') {
            vscode.env.openExternal(vscode.Uri.parse(message.url));
        }

        if (message.type === 'openInWorkspace') {
            const course = getCurrentCourse();
            if (!course) {
                vscode.window.showWarningMessage('Unicode: No course is currently open.');
                return;
            }
            await openAssignmentInWorkspace(context, course, message.coursework);
        }
    });

    panel.onDidDispose(() => {
        registerMainPanel(undefined);
        unicodePanel = undefined;
    });

    return unicodePanel;
}