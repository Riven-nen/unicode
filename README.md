# UniCode: Google Classroom VS Code Extension

A VS Code extension that bridges the gap between Google Classroom and the local development environment. It allows students to fetch coursework directly into their editor and manage their assignments without leaving VS Code.

## Features

*   **Google Classroom Integration:** Authenticate via Google OAuth and fetch coursework directly into the editor.
*   **Local Workspace Generation:** Automatically creates local folders and workspaces tied to specific Google Classroom assignments.
*   **Automated Submission (Workaround):** Since Google's API restricts third-party programmatic submissions (`@ProjectPermissionDenied`), this extension utilizes **Playwright** browser automation to click the "Turn in" button on the student's behalf.
*   **Secure Auth Flow:** Uses Supabase as an intermediary for OAuth token management and redirects via the `vscode://` protocol.

## Tech Stack

*   **Language:** TypeScript
*   **Environment:** VS Code Extension API
*   **Authentication:** Google OAuth 2.0 and Supabase
*   **Automation:** Playwright

## Engineering Challenges and Solutions

Building inside the VS Code Extension sandbox presented several unique challenges:

1.  **OAuth Redirect URI Issues:** Passing the Supabase OAuth token back into the VS Code environment via custom URI schemes (`vscode://`) required careful configuration to avoid security blocks.
2.  **The Google API Wall:** Google restricts apps from turning in assignments unless that specific app created the assignment. 
    *   *Solution:* We implemented a Playwright-based browser automation script that spins up a headless browser, logs in with the student's session, and clicks the "Turn in" button programmatically.
3.  **Sandbox Limitations:** The VS Code extension sandbox restricts certain Node.js and browser automation capabilities, requiring specific webpack/extension configurations to run Playwright smoothly.

## Installation and Setup

1.  Clone the repository:

    ```bash
    git clone https://github.com/Riven-nen/unicode-vscode-extension.git
    cd unicode-vscode-extension
    ```

2.  Install dependencies:

    ```bash
    npm install
    ```

3.  Set up environment variables. Create a `.env` file in the root directory with your Supabase and Google API credentials:

    ```env
    SUPABASE_URL=your_supabase_url
    SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  Run the extension:
    *   Open the project in VS Code.
    *   Press `F5` to launch the Extension Development Host.
    *   Run the command `UniCode: Login to Google Classroom` from the Command Palette (`Ctrl+Shift+P`).

## Built With

*   [VS Code Extension API](https://code.visualstudio.com/api)
*   [Google Classroom API](https://developers.google.com/classroom)
*   [Supabase](https://supabase.com/)
*   [Playwright](https://playwright.dev/)
