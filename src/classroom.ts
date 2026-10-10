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

function parseGoogleError(text: string): string | null {
    try {
        const parsed = JSON.parse(text);
        return parsed?.error?.message ?? null;
    } catch {
        return null;
    }
}

export async function submitAssignment(
    courseId: string,
    courseWorkId: string,
    submissionId: string,
    submission: { fileName: string; contentType: string; buffer: Buffer }
): Promise<void> {
    if (!ctx) throw new Error('Classroom not initialized');

    const token = await ctx.secrets.get('unicode.googleAccessToken');
    if (!token) {
        throw new Error('Not signed in. Please log in again.');
    }

    // Step 1: Upload to Drive
    const boundary = 'unicode_' + Math.random().toString(36).slice(2);
    const metadata = JSON.stringify({ name: submission.fileName });

    const body = Buffer.concat([
        Buffer.from(`--${boundary}\r\n`),
        Buffer.from(`Content-Type: application/json; charset=UTF-8\r\n\r\n`),
        Buffer.from(`${metadata}\r\n`),
        Buffer.from(`--${boundary}\r\n`),
        Buffer.from(`Content-Type: ${submission.contentType}\r\n\r\n`),
        submission.buffer,
        Buffer.from(`\r\n--${boundary}--`)
    ]);

    const uploadRes = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': `multipart/related; boundary=${boundary}`
            },
            body
        }
    );

    if (!uploadRes.ok) {
        const errText = await uploadRes.text();
        const msg = parseGoogleError(errText) ?? `Upload failed (${uploadRes.status})`;
        throw new Error(msg);
    }

    const uploaded = (await uploadRes.json()) as { id?: string };
    if (!uploaded.id) {
        throw new Error('Upload succeeded but no file ID returned.');
    }

    // Step 2: Attach
    const attachRes = await fetch(
        `https://classroom.googleapis.com/v1/courses/${courseId}/courseWork/${courseWorkId}/studentSubmissions/${submissionId}:modifyAttachments`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                addAttachments: [{ driveFile: { id: uploaded.id } }]
            })
        }
    );

    if (!attachRes.ok) {
        const errText = await attachRes.text();
        const msg = parseGoogleError(errText) ?? `Attach failed (${attachRes.status})`;
        throw new Error(msg);
    }

    // Step 3: Turn in
    const turnInRes = await fetch(
        `https://classroom.googleapis.com/v1/courses/${courseId}/courseWork/${courseWorkId}/studentSubmissions/${submissionId}:turnIn`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        }
    );

    if (!turnInRes.ok) {
        const errText = await turnInRes.text();
        const msg = parseGoogleError(errText) ?? `Turn-in failed (${turnInRes.status})`;
        throw new Error(msg);
    }

    console.log('[unicode] submitted successfully');
}

export type StudentSubmission = {
    id: string;
    state?: 'NEW' | 'CREATED' | 'TURNED_IN' | 'RETURNED' | 'RECLAIMED_BY_STUDENT';
    late?: boolean;
    assignedGrade?: number;
    draftGrade?: number;
    alternateLink?: string;
};

type SubmissionsResponse = { studentSubmissions?: StudentSubmission[] };

export async function fetchSubmission(
    courseId: string,
    courseWorkId: string
): Promise<StudentSubmission | null> {
    try {
        const res = await authorizedFetch(
            `https://classroom.googleapis.com/v1/courses/${courseId}/courseWork/${courseWorkId}/studentSubmissions?userId=me`
        );

        if (!res.ok) {
            console.log('[unicode] submission fetch error:', res.status);
            return null;
        }

        const data = (await res.json()) as SubmissionsResponse;
        return data.studentSubmissions?.[0] ?? null;
    } catch (err) {
        console.log('[unicode] fetch submission error:', err);
        return null;
    }
}