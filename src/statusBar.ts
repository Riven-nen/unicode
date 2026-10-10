import * as vscode from 'vscode';
import { GoogleCourseWork, getCoursework, getCurrentCourse } from './state';

let statusBarItem: vscode.StatusBarItem | undefined;

export function initStatusBar(context: vscode.ExtensionContext) {
    statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Left,
        100
    );
    statusBarItem.command = 'unicode.openNearestDeadline';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    context.subscriptions.push(
        vscode.commands.registerCommand('unicode.openNearestDeadline', () => {
            const nearest = findNearestDeadline(getCoursework());
            if (!nearest) {
                vscode.commands.executeCommand('unicode.startWebview');
                return;
            }
            vscode.commands.executeCommand('unicode.startWebview');
            // Notify the webview which assignment to focus
            // (handled by unicodeMain's ready/selection flow)
        })
    );

    refreshStatusBar();
    const interval = setInterval(() => refreshStatusBar(), 60 * 1000);
    context.subscriptions.push({ dispose: () => clearInterval(interval) });
}

export function refreshStatusBar() {
    if (!statusBarItem) return;

    const coursework = getCoursework();
    const nearest = findNearestDeadline(coursework);

    if (!nearest) {
        statusBarItem.text = '$(calendar) Unicode · No upcoming deadlines';
        statusBarItem.tooltip = 'No coursework with a due date in the current class';
        return;
    }

    const { cw, dueAt } = nearest;
    const relative = formatRelative(dueAt);

    statusBarItem.text = `$(calendar) Due ${relative} · ${cw.title}`;
    statusBarItem.tooltip = `${cw.title}\n${dueAt.toLocaleString()}`;
}

type Deadline = { cw: GoogleCourseWork; dueAt: Date };

function findNearestDeadline(coursework: GoogleCourseWork[]): Deadline | null {
    const now = Date.now();
    let nearest: Deadline | null = null;

    for (const cw of coursework) {
        const dueAt = parseDue(cw);
        if (!dueAt) continue;
        if (dueAt.getTime() < now) continue; // already past

        if (!nearest || dueAt.getTime() < nearest.dueAt.getTime()) {
            nearest = { cw, dueAt };
        }
    }

    return nearest;
}

function parseDue(cw: GoogleCourseWork): Date | null {
    if (!cw.dueDate) return null;
    const { year, month, day } = cw.dueDate;
    const h = cw.dueTime?.hours ?? 23;
    const m = cw.dueTime?.minutes ?? 59;

    // Local time, no UTC conversion
    return new Date(year, month - 1, day, h, m, 0, 0);
}

function formatRelative(dueAt: Date): string {
    const diff = dueAt.getTime() - Date.now();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) {
        const mins = Math.floor(diff / (1000 * 60));
        return `in ${mins}m`;
    }
    if (hours < 24) {
        return `in ${hours}h`;
    }
    if (days === 1) {
        return 'tomorrow';
    }
    if (days < 7) {
        return `in ${days}d`;
    }
    return dueAt.toLocaleDateString();
}