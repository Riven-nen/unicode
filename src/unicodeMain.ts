import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import {
    registerMainPanel,
    getUser,
    getCurrentCourse,
    getCoursework,
    getLinkedAssignments,
    getCourses,
    setCourses,
    setCurrentCourse,
    setCoursework
} from './state';
import { openAssignmentInWorkspace, packageAssignment } from './workspace';
import { fetchSubmission, submitAssignment, fetchCourses, fetchCoursework } from './classroom';

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

    unicodePanel.iconPath = vscode.Uri.joinPath(
        context.extensionUri,
        'media',
        'pics',
        'logo-white.svg'
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
            panel.webview.postMessage({ type: 'authState', user: getUser() });
            panel.webview.postMessage({ type: 'courses', courses: getCourses() });
            panel.webview.postMessage({ type: 'currentCourse', course: getCurrentCourse() });
            panel.webview.postMessage({ type: 'coursework', coursework: getCoursework() });
        }

        if (message.type === 'openExternal') {
            let url = message.url;
            const user = getUser();

            if (user?.email && !url.includes('authuser=')) {
                const sep = url.includes('?') ? '&' : '?';
                url = `${url}${sep}authuser=${encodeURIComponent(user.email)}`;
            }

            vscode.env.openExternal(vscode.Uri.parse(url));
        }

        if (message.type === 'openInWorkspace') {
            const course = getCurrentCourse();
            if (!course) {
                vscode.window.showWarningMessage('Unicode: No course is currently open.');
                return;
            }
            await openAssignmentInWorkspace(context, course, message.coursework);
        }

        if (message.type === 'refresh') {
            const course = getCurrentCourse();
            if (!course) return;

            vscode.window.setStatusBarMessage('Unicode: Refreshing...', 2000);

            const courses = await fetchCourses();
            setCourses(courses);

            const refreshed = courses.find(c => c.id === course.id) ?? course;
            setCurrentCourse(refreshed);

            const coursework = await fetchCoursework(refreshed.id);
            setCoursework(coursework);
        }

        if (message.type === 'fetchSubmissionState') {
            const course = getCurrentCourse();
            if (!course) {
                panel.webview.postMessage({
                    type: 'submissionState',
                    courseWorkId: message.courseWorkId,
                    submission: null
                });
                return;
            }

            const submission = await fetchSubmission(course.id, message.courseWorkId);
            panel.webview.postMessage({
                type: 'submissionState',
                courseWorkId: message.courseWorkId,
                submission: submission ?? null
            });
        }

        if (message.type === 'submitAssignment') {
            const course = getCurrentCourse();
            if (!course) {
                vscode.window.showErrorMessage('Unicode: No course selected.');
                return;
            }

            const coursework = getCoursework().find(cw => cw.id === message.courseWorkId);
            if (!coursework) {
                vscode.window.showErrorMessage('Unicode: Assignment not found.');
                return;
            }

            const linked = getLinkedAssignments(context).find(
                a => a.courseWorkId === message.courseWorkId
            );
            if (!linked) {
                vscode.window.showWarningMessage(
                    'Unicode: Open this assignment in a workspace first before submitting.'
                );
                return;
            }

            try {
                panel.webview.postMessage({ type: 'submitProgress', stage: 'preparing' });

                const submission = await fetchSubmission(course.id, coursework.id);
                if (!submission) {
                    throw new Error('Could not find your submission record for this assignment.');
                }

                const packaged = await packageAssignment(linked.folderPath, coursework.title);
                if (!packaged) {
                    throw new Error('No files found to submit.');
                }

                panel.webview.postMessage({ type: 'submitProgress', stage: 'uploading' });
                await submitAssignment(course.id, coursework.id, submission.id, packaged);

                panel.webview.postMessage({
                    type: 'submitted',
                    courseWorkId: coursework.id
                });

                vscode.window.showInformationMessage(
                    `Unicode: Submitted "${coursework.title}" ✓`
                );
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                console.log('[unicode] submit failed:', msg);

                panel.webview.postMessage({
                    type: 'submitFailed',
                    courseWorkId: coursework.id,
                    error: msg
                });

                vscode.window.showErrorMessage(`Unicode: ${msg}`);
            }
        }
    });

    panel.onDidDispose(() => {
        registerMainPanel(undefined);
        unicodePanel = undefined;
    });

    return unicodePanel;
}