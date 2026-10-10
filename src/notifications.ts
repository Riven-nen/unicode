import * as vscode from 'vscode';
import { GoogleCourseWork, getCoursework } from './state';

const NOTIFIED_KEY = 'unicode.notifiedDeadlines';
const WINDOW_HOURS = 24;

export function checkDeadlineNotifications(context: vscode.ExtensionContext) {
    const coursework = getCoursework();
    if (coursework.length === 0) return;

    const now = Date.now();
    const notified = context.globalState.get<string[]>(NOTIFIED_KEY, []);
    const newlyNotified: string[] = [];

    for (const cw of coursework) {
        const dueAt = parseDue(cw);
        if (!dueAt) continue;

        const hoursUntil = (dueAt.getTime() - now) / (1000 * 60 * 60);
        if (hoursUntil < 0 || hoursUntil > WINDOW_HOURS) continue;

        const key = `${cw.id}:${dueAt.getTime()}`;
        if (notified.includes(key)) continue;

        newlyNotified.push(key);

        const label = hoursUntil < 1
            ? `in ${Math.max(1, Math.floor(hoursUntil * 60))} minutes`
            : `in ${Math.floor(hoursUntil)} hours`;

        vscode.window.showWarningMessage(
            `Unicode: "${cw.title}" is due ${label}.`,
            'Open in Classroom'
        ).then(action => {
            if (action === 'Open in Classroom' && cw.alternateLink) {
                vscode.env.openExternal(vscode.Uri.parse(cw.alternateLink));
            }
        });
    }

    if (newlyNotified.length > 0) {
        context.globalState.update(NOTIFIED_KEY, [...notified, ...newlyNotified]);
    }
}

function parseDue(cw: GoogleCourseWork): Date | null {
    if (!cw.dueDate) return null;
    const { year, month, day } = cw.dueDate;
    const h = cw.dueTime?.hours ?? 23;
    const m = cw.dueTime?.minutes ?? 59;
    return new Date(year, month - 1, day, h, m, 0, 0);
}