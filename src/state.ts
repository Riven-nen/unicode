import * as vscode from 'vscode';

let currentUser: string | null = null;
let sidebarView: vscode.WebviewView | undefined;
let mainPanel: vscode.WebviewPanel | undefined;

export function registerSidebar(view: vscode.WebviewView | undefined) {
    sidebarView = view;
}

export function registerMainPanel(panel: vscode.WebviewPanel | undefined) {
    mainPanel = panel;
}

export function getUser() {
    return currentUser;
}

export function setUser(user: string | null) {
    currentUser = user;

    const payload = { type: 'authState', user: currentUser };
    sidebarView?.webview.postMessage(payload);
    mainPanel?.webview.postMessage(payload);
}