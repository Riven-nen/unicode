import * as vscode from 'vscode';

// Cached in memory; persisted in context.globalState.
let currentUser: UserProfile | null = null;

// Runtime-only references — never persisted.
let sidebarView: vscode.WebviewView | undefined;
let mainPanel: vscode.WebviewPanel | undefined;

// Stashed here so callers don't have to pass context around.
let ctx: vscode.ExtensionContext | undefined;

export type UserProfile = {
    name: string;
    role: 'Student' | 'Teacher';
    userId: string;
};

const USER_KEY = 'unicode.user';

export function registerSidebar(view: vscode.WebviewView | undefined) {
    sidebarView = view;
}

export function registerMainPanel(panel: vscode.WebviewPanel | undefined) {
    mainPanel = panel;
}

export function initUser(context: vscode.ExtensionContext) {
    ctx = context;
    currentUser = context.globalState.get<UserProfile | null>(USER_KEY, null);
}

export function getUser(): UserProfile | null {
    return currentUser;
}

export async function setUser(user: UserProfile | null) {
    if (!ctx) {
        throw new Error('setUser called before initUser');
    }

    currentUser = user;

    await ctx.globalState.update(USER_KEY, user ?? undefined);

    const payload = { type: 'authState', user };
    sidebarView?.webview.postMessage(payload);
    mainPanel?.webview.postMessage(payload);
}