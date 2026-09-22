import * as vscode from 'vscode';
import { GoogleCourse, GoogleCourseWork } from './state';

let ctx: vscode.ExtensionContext | undefined;

export function initClassroom(context: vscode.ExtensionContext) {
    ctx = context;
}

type CoursesResponse = { courses?: GoogleCourse[] };
type CourseWorkResponse = { courseWork?: GoogleCourseWork[] };

async function getToken(): Promise<string | null> {
    if (!ctx) {throw new Error('classroom not initialized');}
    return (await ctx.secrets.get('unicode.googleAccessToken')) ?? null;
}

export async function fetchCourses(): Promise<GoogleCourse[]> {
    try {
        const token = await getToken();
        if (!token) {
            console.log('[unicode] no google access token');
            return [];
        }

        const res = await fetch(
            'https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE',
            { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.status === 401) {
            console.log('[unicode] google token expired');
            vscode.window.showWarningMessage('Unicode: Google session expired. Please sign in again.');
            return [];
        }

        if (!res.ok) {
            console.log('[unicode] classroom API error:', res.status, await res.text());
            return [];
        }

        const data = (await res.json()) as CoursesResponse;
        return data.courses ?? [];
    } catch (err) {
        console.log('[unicode] fetch error:', err);
        return [];
    }
}

export async function fetchCoursework(courseId: string): Promise<GoogleCourseWork[]> {
    try {
        const token = await getToken();
        if (!token) {
            console.log('[unicode] no google access token');
            return [];
        }

        const res = await fetch(
            `https://classroom.googleapis.com/v1/courses/${courseId}/courseWork`,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!res.ok) {
            console.log('[unicode] coursework API error:', res.status, await res.text());
            return [];
        }

        const data = (await res.json()) as CourseWorkResponse;
        return data.courseWork ?? [];
    } catch (err) {
        console.log('[unicode] fetch coursework error:', err);
        return [];
    }
}