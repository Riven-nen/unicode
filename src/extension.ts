/* eslint-disable curly */
import * as vscode from 'vscode';
import { UnicodeViewProvider } from './unicodeSidebar';
import { createUnicodeWebview } from './unicodeMain';
import {
    setUser, getUser, initUser, setCourses,
    setCurrentCourse, setCoursework, getCourses
} from './state';
import { initClassroom, fetchCourses, fetchCoursework } from './classroom';

const SUPABASE_URL = 'https://sgidphfnfrafilphfbha.supabase.co';
const REDIRECT_URI = 'vscode://rivencode.unicode/auth';

const SCOPES = [
    'openid',
    'email',
    'profile',
    'https://www.googleapis.com/auth/classroom.courses.readonly',
    'https://www.googleapis.com/auth/classroom.rosters.readonly',
    'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
].join(' ');

export function activate(context: vscode.ExtensionContext) {
    initUser(context);
    initClassroom(context);
    console.log('[unicode] user on activation:', getUser());

    const unicodeViewProvider = new UnicodeViewProvider(context);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('unicode-main', unicodeViewProvider)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('unicode.startWebview', () => {
            createUnicodeWebview(context);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('unicode.openCourse', async (courseId: string) => {
            const course = getCourses().find(c => c.id === courseId) ?? null;
            setCurrentCourse(course);

            createUnicodeWebview(context);

            if (!course) return;

            const coursework = await fetchCoursework(course.id);
            setCoursework(coursework);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('unicode.login', () => {
            const authUrl =
                `${SUPABASE_URL}/auth/v1/authorize` +
                `?provider=google` +
                `&scopes=${encodeURIComponent(SCOPES)}` +
                `&redirect_to=${encodeURIComponent(REDIRECT_URI)}`;

            vscode.env.openExternal(vscode.Uri.parse(authUrl));
        })
    );

    context.subscriptions.push(
        vscode.window.registerUriHandler({
            async handleUri(uri: vscode.Uri) {
                try {
                    const params = new URLSearchParams(uri.fragment || uri.query);

                    const accessToken = params.get('access_token');
                    const refreshToken = params.get('refresh_token');
                    const providerToken = params.get('provider_token');
                    const providerRefreshToken = params.get('provider_refresh_token');

                    if (!accessToken) return;

                    await context.secrets.store('unicode.accessToken', accessToken);
                    if (refreshToken) await context.secrets.store('unicode.refreshToken', refreshToken);
                    if (providerToken) await context.secrets.store('unicode.googleAccessToken', providerToken);
                    if (providerRefreshToken) await context.secrets.store('unicode.googleRefreshToken', providerRefreshToken);

                    const payload = JSON.parse(
                        Buffer.from(accessToken.split('.')[1], 'base64url').toString()
                    );

                    await setUser({
                        name: payload.user_metadata?.full_name ?? 'User',
                        role: 'Student',
                        userId: payload.sub,
                        picture: payload.user_metadata?.avatar_url,
                    });

                    const courses = await fetchCourses();
                    setCourses(courses);

                    vscode.window.showInformationMessage(
                        `Signed in as ${payload.user_metadata?.full_name ?? 'user'}`
                    );
                } catch (err) {
                    console.error('[unicode] URI handler failed:', err);
                }
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('unicode.logout', async () => {
            await context.secrets.delete('unicode.accessToken');
            await context.secrets.delete('unicode.refreshToken');
            await context.secrets.delete('unicode.googleAccessToken');
            await context.secrets.delete('unicode.googleRefreshToken');
            await setUser(null);
            setCourses([]);
            setCurrentCourse(null);
            setCoursework([]);
        })
    );

    if (getUser()) {
        fetchCourses().then(setCourses);
    }
}

export function deactivate() {}