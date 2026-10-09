import * as vscode from 'vscode';
import {
    GoogleCourse,
    GoogleCourseWork,
    setUser,
    setCourses,
    setCurrentCourse,
    setCoursework
} from './state';
import { refreshGoogleToken } from './auth';

let ctx: vscode.ExtensionContext | undefined;

export function initClassroom(context: vscode.ExtensionContext) {
    ctx = context;
}

type CoursesResponse = { courses?: GoogleCourse[] };
type CourseWorkResponse = { courseWork?: GoogleCourseWork[] };

async function authorizedFetch(url: string): Promise<Response> {
    if (!ctx) throw new Error('classroom not initialized');

    let token = await ctx.secrets.get('unicode.googleAccessToken');

    // If no access token at all, try to refresh one
    if (!token) {
        console.log('[unicode] no access token, attempting refresh');
        const refreshed = await refreshGoogleToken();
        if (!refreshed) {
            console.log('[unicode] refresh failed — logging out');
            await forceLogout();
            return new Response(null, { status: 401 });
        }
        token = refreshed;
    }

    const doFetch = (t: string) =>
        fetch(url, { headers: { Authorization: `Bearer ${t}` } });

    let res = await doFetch(token);

    // If token was stale, try refresh and retry once
    if (res.status === 401) {
        console.log('[unicode] got 401, attempting refresh');
        const refreshed = await refreshGoogleToken();
        if (!refreshed) {
            console.log('[unicode] refresh failed — logging out');
            await forceLogout();
            return res;
        }
        res = await doFetch(refreshed);
    }

    return res;
}

async function forceLogout() {
    console.log('[unicode] force logout');
    if (ctx) {
        await ctx.secrets.delete('unicode.accessToken');
        await ctx.secrets.delete('unicode.refreshToken');
        await ctx.secrets.delete('unicode.googleAccessToken');
        await ctx.secrets.delete('unicode.googleRefreshToken');
    }
    await setUser(null);
    setCourses([]);
    setCurrentCourse(null);
    setCoursework([]);
    vscode.window.showWarningMessage('Unicode: Session expired. Please sign in again.');
}

export async function fetchCourses(): Promise<GoogleCourse[]> {
    try {
        const res = await authorizedFetch(
            'https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE'
        );

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
        const res = await authorizedFetch(
            `https://classroom.googleapis.com/v1/courses/${courseId}/courseWork`
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