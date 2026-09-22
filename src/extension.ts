import * as vscode from 'vscode';
import { UnicodeViewProvider } from './unicodeSidebar';
import { createUnicodeWebview } from './unicodeMain';
import { setUser, getUser, initUser } from './state';

const SUPABASE_URL = 'https://sgidphfnfrafilphfbha.supabase.co';
const REDIRECT_URI = 'vscode://rivencode.unicode/auth';

export function activate(context: vscode.ExtensionContext) {
    initUser(context);
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

    // Opens the browser → Supabase → Google → redirects back to vscode://
    context.subscriptions.push(
        vscode.commands.registerCommand('unicode.login', () => {
            const authUrl =
                `${SUPABASE_URL}/auth/v1/authorize` +
                `?provider=google` +
                `&redirect_to=${encodeURIComponent(REDIRECT_URI)}`;

            console.log('[unicode] opening auth URL:', authUrl);
            vscode.env.openExternal(vscode.Uri.parse(authUrl));
        })
    );

    // Catches the vscode:// callback after Supabase redirects
    context.subscriptions.push(
        vscode.window.registerUriHandler({
            async handleUri(uri: vscode.Uri) {
                const params = new URLSearchParams(uri.fragment || uri.query);

                const accessToken = params.get('access_token');
                const refreshToken = params.get('refresh_token');

                if (!accessToken) {
                    console.log('[unicode] no access token in callback');
                    return;
                }

                // Store tokens securely
                await context.secrets.store('unicode.accessToken', accessToken);
                if (refreshToken) {
                    await context.secrets.store('unicode.refreshToken', refreshToken);
                }

                // Decode the JWT payload (middle segment)
                const payload = JSON.parse(
                    Buffer.from(accessToken.split('.')[1], 'base64').toString()
                );

                await setUser({
                    name: payload.user_metadata?.full_name ?? 'User',
                    role: 'Student',
                    userId: payload.sub,
                });

                // vscode.window.showInformationMessage(
                //     `Signed in as ${payload.user_metadata?.full_name ?? 'user'}`
                // );
            }
        })
    );

    // Logout command
    context.subscriptions.push(
        vscode.commands.registerCommand('unicode.logout', async () => {
            await setUser(null);
        })
    );

    // Debug login (kept for testing)
    context.subscriptions.push(
        vscode.commands.registerCommand('unicode.fakeLogin', async () => {
            await setUser({ name: 'User', role: 'Student', userId: 'test-123' });
        })
    );
}

export function deactivate() {}