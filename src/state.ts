import * as vscode from 'vscode';

// Cached in memory; persisted in context.globalState.
let currentUser: UserProfile | null = null;

// Runtime-only references — never persisted.
let sidebarView: vscode.WebviewView | undefined;
let mainPanel: vscode.WebviewPanel | undefined;

export type UserProfile = {
    name: string;
    role: 'Student' | 'Teacher';
    userId: number;
};

// Key used to namespace our entry in globalState.
const USER_KEY = 'unicode.user';

export function registerSidebar(view: vscode.WebviewView | undefined) {
    sidebarView = view;
}

export function registerMainPanel(panel: vscode.WebviewPanel | undefined) {
    mainPanel = panel;
}

export function initUser(context: vscode.ExtensionContext) {
    currentUser = context.globalState.get<UserProfile | null>(USER_KEY, null);
}

export function getUser(): UserProfile | null {
    return currentUser;
}

/**
 * Sets the user, persists to globalState, and broadcasts to live webviews.
 * Pass null to log out.
 */
export async function setUser(
    user: UserProfile | null,
    context: vscode.ExtensionContext
) {
    currentUser = user;

    await context.globalState.update(USER_KEY, user ?? undefined);

    const payload = { type: 'authState', user };
    sidebarView?.webview.postMessage(payload);
    mainPanel?.webview.postMessage(payload);
}