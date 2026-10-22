import * as vscode from 'vscode';
import { refreshStatusBar } from './statusBar';

let currentUser: UserProfile | null = null;
let currentCourses: GoogleCourse[] = [];
let currentCourse: GoogleCourse | null = null;
let currentCoursework: GoogleCourseWork[] = [];
let currentSelectedCoursework: GoogleCourseWork | null = null;
let sidebarView: vscode.WebviewView | undefined;
let mainPanel: vscode.WebviewPanel | undefined;
let ctx: vscode.ExtensionContext | undefined;

export type UserProfile = {
    name: string;
    role: 'Student' | 'Teacher';
    userId: string;
    picture?: string;
    email: string;
};

export type GoogleCourse = {
    id: string;
    name: string;
    section?: string;
    room?: string;
    ownerId?: string;
};

export type GoogleCourseWork = {
    id: string;
    title: string;
    description?: string;
    dueDate?: { year: number; month: number; day: number };
    dueTime?: { hours: number; minutes: number };
    state?: string;
    alternateLink?: string;
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
    const stored = context.globalState.get<UserProfile | null>(USER_KEY, null);
    if (stored && !stored.email) {
        currentUser = null;
        context.globalState.update(USER_KEY, undefined);
    } else {
        currentUser = stored;
    }
}

export function getUser(): UserProfile | null {
    return currentUser;
}

export async function setUser(user: UserProfile | null) {
    if (!ctx) throw new Error('setUser called before initUser');
    currentUser = user;
    await ctx.globalState.update(USER_KEY, user ?? undefined);
    const payload = { type: 'authState', user };
    sidebarView?.webview.postMessage(payload);
    mainPanel?.webview.postMessage(payload);
}

export function getCourses(): GoogleCourse[] {
    return currentCourses;
}

export function setCourses(courses: GoogleCourse[]) {
    currentCourses = courses;
    const payload = { type: 'courses', courses };
    sidebarView?.webview.postMessage(payload);
    mainPanel?.webview.postMessage(payload);
}

export function getCurrentCourse(): GoogleCourse | null {
    return currentCourse;
}

export function setCurrentCourse(course: GoogleCourse | null) {
    currentCourse = course;
    // Switching courses clears the selected coursework
    currentSelectedCoursework = null;
    const payload = { type: 'currentCourse', course };
    sidebarView?.webview.postMessage(payload);
    mainPanel?.webview.postMessage(payload);
    mainPanel?.webview.postMessage({
        type: 'selectedCoursework',
        coursework: null
    });
}

export function getCoursework(): GoogleCourseWork[] {
    return currentCoursework;
}

export function setCoursework(coursework: GoogleCourseWork[]) {
    currentCoursework = coursework;
    const payload = { type: 'coursework', coursework };
    mainPanel?.webview.postMessage(payload);

    try {
        const { refreshStatusBar } = require('./statusBar');
        refreshStatusBar();
    } catch (err) {
        console.log('[unicode] status bar refresh failed:', err);
    }
}

export function getSelectedCoursework(): GoogleCourseWork | null {
    return currentSelectedCoursework;
}

export function setSelectedCoursework(cw: GoogleCourseWork | null) {
    currentSelectedCoursework = cw;
    mainPanel?.webview.postMessage({
        type: 'selectedCoursework',
        coursework: cw
    });
}

export type LinkedAssignment = {
    courseId: string;
    courseWorkId: string;
    folderPath: string;
    title: string;
    linkedAt: string;
};

const ASSIGNMENTS_KEY = 'unicode.assignments';

export function getLinkedAssignments(context: vscode.ExtensionContext): LinkedAssignment[] {
    return context.globalState.get<LinkedAssignment[]>(ASSIGNMENTS_KEY, []);
}

export async function addLinkedAssignment(
    context: vscode.ExtensionContext,
    entry: LinkedAssignment
) {
    const all = getLinkedAssignments(context).filter(
        a => a.courseWorkId !== entry.courseWorkId
    );
    all.push(entry);
    await context.globalState.update(ASSIGNMENTS_KEY, all);
}

export async function removeLinkedAssignment(
    context: vscode.ExtensionContext,
    courseWorkId: string
) {
    const all = getLinkedAssignments(context).filter(
        a => a.courseWorkId !== courseWorkId
    );
    await context.globalState.update(ASSIGNMENTS_KEY, all);
}