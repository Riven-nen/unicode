import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { GoogleCourse, GoogleCourseWork } from './state';
import { addLinkedAssignment } from './state';
import AdmZip from 'adm-zip';

function slugify(input: string): string {
    return input
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 64) || 'assignment';
}

export async function openAssignmentInWorkspace(
    context: vscode.ExtensionContext,
    course: GoogleCourse,
    coursework: GoogleCourseWork
) {
    const root = await resolveRootFolder(context);
    if (!root) return;

    const courseFolder = slugify(course.name);
    const assignmentFolder = slugify(coursework.title);

    const folderUri = vscode.Uri.joinPath(
        root,
        'unicode',
        courseFolder,
        assignmentFolder
    );

    const folderPath = folderUri.fsPath;

    try {
        await fs.mkdir(folderPath, { recursive: true });
    } catch (err) {
        vscode.window.showErrorMessage(`Unicode: Could not create folder. ${err}`);
        return;
    }

    const readmePath = path.join(folderPath, 'README.md');
    const readmeContent = buildReadme(course, coursework);
    await fs.writeFile(readmePath, readmeContent, 'utf-8');

    const starterPath = path.join(folderPath, 'main.py');
    const starterContent = buildStarter(coursework);
    try {
        await fs.access(starterPath);
    } catch {
        await fs.writeFile(starterPath, starterContent, 'utf-8');
    }

    const metaPath = path.join(folderPath, '.unicode.json');
    const metaContent = JSON.stringify(
        {
            courseId: course.id,
            courseWorkId: coursework.id,
            courseName: course.name,
            title: coursework.title,
            dueDate: coursework.dueDate ?? null,
            dueTime: coursework.dueTime ?? null,
            alternateLink: coursework.alternateLink ?? null,
            linkedAt: new Date().toISOString()
        },
        null,
        2
    );
    await fs.writeFile(metaPath, metaContent, 'utf-8');

    const gitignorePath = path.join(root.fsPath, 'unicode', '.gitignore');
    try {
        await fs.access(gitignorePath);
    } catch {
        await fs.writeFile(gitignorePath, '*\n', 'utf-8');
    }

    await addLinkedAssignment(context, {
        courseId: course.id,
        courseWorkId: coursework.id,
        folderPath,
        title: coursework.title,
        linkedAt: new Date().toISOString()
    });

    const mainUri = vscode.Uri.file(starterPath);
    const doc = await vscode.workspace.openTextDocument(mainUri);
    await vscode.window.showTextDocument(doc);

    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        const action = await vscode.window.showInformationMessage(
            `Unicode: Assignment created. Open the folder as a workspace?`,
            'Open Folder',
            'Not Now'
        );
        if (action === 'Open Folder') {
            await vscode.commands.executeCommand('vscode.openFolder', root, {
                forceNewWindow: false
            });
        }
    } else {
        vscode.window.showInformationMessage(
            `Unicode: Linked "${coursework.title}" to ${folderPath}`
        );
    }
}

function buildReadme(course: GoogleCourse, coursework: GoogleCourseWork): string {
    const due = formatDue(coursework);
    return [
        `# ${coursework.title}`,
        '',
        `**Course:** ${course.name}`,
        `**Due:** ${due}`,
        '',
        '## Description',
        '',
        coursework.description?.trim() || '_No description provided._',
        '',
        coursework.alternateLink
            ? `[Open in Google Classroom](${coursework.alternateLink})`
            : '',
        ''
    ].join('\n');
}

function buildStarter(coursework: GoogleCourseWork): string {
    const lines = [
        `# ${coursework.title}`,
        '#',
        ...(coursework.description ?? '')
            .split('\n')
            .map(line => `# ${line}`),
        '#',
        ''
    ];
    return lines.join('\n');
}

function formatDue(cw: GoogleCourseWork): string {
    if (!cw.dueDate) return 'No due date';
    const { year, month, day } = cw.dueDate;
    const t = cw.dueTime
        ? ` at ${String(cw.dueTime.hours).padStart(2, '0')}:${String(
              cw.dueTime.minutes
          ).padStart(2, '0')}`
        : '';
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}${t}`;
}

async function resolveRootFolder(context: vscode.ExtensionContext): Promise<vscode.Uri | null> {
    const folders = vscode.workspace.workspaceFolders;
    if (folders && folders.length > 0) {
        return folders[0].uri;
    }

    const stored = context.globalState.get<string>('unicode.defaultRoot');
    if (stored) {
        return vscode.Uri.file(stored);
    }

    const picked = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        openLabel: 'Use this folder for Unicode assignments',
        title: 'Unicode: Choose a folder for your assignments'
    });

    if (!picked || picked.length === 0) {
        vscode.window.showInformationMessage(
            'Unicode: No folder chosen. Open a folder in VS Code and try again.'
        );
        return null;
    }

    await context.globalState.update('unicode.defaultRoot', picked[0].fsPath);
    return picked[0];
}

const JUNK_DIRS = new Set([
    'node_modules',
    'target',
    'build',
    'dist',
    'out',
    '.git',
    '.gradle',
    '.idea',
    '.vscode',
    'bin',
    'obj'
]);

const SKIP_FILES = new Set([
    '.unicode.json',
    'README.md',
    '.gitignore'
]);

export type PackagedSubmission = {
    fileName: string;
    contentType: string;
    buffer: Buffer;
};

export async function packageAssignment(
    folderPath: string,
    assignmentTitle: string
): Promise<PackagedSubmission | null> {
    const entries = await fs.readdir(folderPath, { withFileTypes: true });

    const realFiles = entries.filter(
        e => e.isFile() && !SKIP_FILES.has(e.name)
    );

    const realDirs = entries.filter(
        e => e.isDirectory() && !JUNK_DIRS.has(e.name)
    );

    // Single file, no folders → upload raw
    if (realFiles.length === 1 && realDirs.length === 0) {
        const file = realFiles[0];
        const fullPath = path.join(folderPath, file.name);
        const buffer = await fs.readFile(fullPath);

        return {
            fileName: file.name,
            contentType: guessContentType(file.name),
            buffer
        };
    }

    // Nothing to submit
    if (realFiles.length === 0 && realDirs.length === 0) {
        return null;
    }

    // Multiple files or folders → zip
    const zip = new AdmZip();

    for (const file of realFiles) {
        zip.addLocalFile(path.join(folderPath, file.name));
    }

    for (const dir of realDirs) {
        zip.addLocalFolder(path.join(folderPath, dir.name), dir.name);
    }

    const safeName = assignmentTitle
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase() || 'submission';

    return {
        fileName: `${safeName}.zip`,
        contentType: 'application/zip',
        buffer: zip.toBuffer()
    };
}

function guessContentType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();
    const map: Record<string, string> = {
        '.py': 'text/x-python',
        '.js': 'application/javascript',
        '.ts': 'application/typescript',
        '.java': 'text/x-java-source',
        '.c': 'text/x-c',
        '.cpp': 'text/x-c++',
        '.cs': 'text/x-csharp',
        '.rb': 'text/x-ruby',
        '.go': 'text/x-go',
        '.rs': 'text/x-rust',
        '.php': 'application/x-php',
        '.html': 'text/html',
        '.css': 'text/css',
        '.json': 'application/json',
        '.md': 'text/markdown',
        '.txt': 'text/plain'
    };
    return map[ext] ?? 'application/octet-stream';
}