import * as vscode from 'vscode';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from './secrets';

let ctx: vscode.ExtensionContext | undefined;

export function initAuth(context: vscode.ExtensionContext) {
    ctx = context;
}

export async function refreshGoogleToken(): Promise<string | null> {
    if (!ctx) throw new Error('auth not initialized');

    const refreshToken = await ctx.secrets.get('unicode.googleRefreshToken');
    if (!refreshToken) {
        console.log('[unicode] no google refresh token stored');
        return null;
    }

    try {
        const res = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                refresh_token: refreshToken,
                grant_type: 'refresh_token'
            })
        });

        if (!res.ok) {
            console.log('[unicode] refresh failed:', res.status, await res.text());
            return null;
        }

        const data = await res.json() as { access_token?: string };
        if (!data.access_token) return null;

        await ctx.secrets.store('unicode.googleAccessToken', data.access_token);
        console.log('[unicode] google token refreshed');
        return data.access_token;
    } catch (err) {
        console.log('[unicode] refresh error:', err);
        return null;
    }
}

export async function clearAuthSecrets() {
    if (!ctx) return;
    await ctx.secrets.delete('unicode.accessToken');
    await ctx.secrets.delete('unicode.refreshToken');
    await ctx.secrets.delete('unicode.googleAccessToken');
    await ctx.secrets.delete('unicode.googleRefreshToken');
}