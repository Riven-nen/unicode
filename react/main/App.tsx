import Login from './tsx/Login';
import { vscode } from '../vscodeApi';
import { useEffect, useState } from 'react';
import './css/index.css';

type UserProfile = {
    name: string;
    role: 'Student' | 'Teacher';
    userId: string;
};

type GoogleCourse = {
    id: string;
    name: string;
    section?: string;
};

type GoogleCourseWork = {
    id: string;
    title: string;
    description?: string;
    dueDate?: { year: number; month: number; day: number };
    dueTime?: { hours: number; minutes: number };
    state?: string;
    alternateLink?: string;
    materials?: Array<{
        driveFile?: { driveFile?: { title?: string; alternateLink?: string } };
        link?: { url?: string; title?: string };
        youtubeVideo?: { title?: string; alternateLink?: string };
        form?: { title?: string; formUrl?: string };
    }>;
};

function formatDue(cw: GoogleCourseWork): string {
    if (!cw.dueDate) return 'No due date';
    const { year, month, day } = cw.dueDate;
    const t = cw.dueTime
        ? ` · ${String(cw.dueTime.hours).padStart(2, '0')}:${String(cw.dueTime.minutes).padStart(2, '0')}`
        : '';
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}${t}`;
}

function App() {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [course, setCourse] = useState<GoogleCourse | null>(null);
    const [coursework, setCoursework] = useState<GoogleCourseWork[]>([]);
    const [selectedCoursework, setSelectedCoursework] = useState<GoogleCourseWork | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const message = event.data;
            if (message.type === 'authState') {
                setUser(message.user);
                setLoading(false);
            }
            if (message.type === 'currentCourse') {
                setCourse(message.course);
                setSelectedCoursework(null);
            }
            if (message.type === 'coursework') {
                setCoursework(message.coursework);
            }
        };

        window.addEventListener('message', handleMessage);
        vscode.postMessage({ type: 'ready' });

        return () => window.removeEventListener('message', handleMessage);
    }, []);

    if (loading) return <div className="app-loading" />;
    if (!user) return <Login />;

    if (!course) {
        return (
            <div className="main-empty">
                <div className="main-empty-icon">▤</div>
                <h2>Unicode</h2>
                <p>Select a class from the sidebar to view its coursework.</p>
            </div>
        );
    }

    if (selectedCoursework) {
        return (
            <AssignmentDetail
                coursework={selectedCoursework}
                onBack={() => setSelectedCoursework(null)}
            />
        );
    }

    return (
        <div className="main-container">
            <header className="main-banner">
                <div className="banner-content">
                    <h1 className="banner-title">{course.name}</h1>
                    {course.section && (
                        <div className="banner-meta">
                            <span>{course.section}</span>
                        </div>
                    )}
                </div>
            </header>

            <div className="main-body">
                <div className="coursework-header">
                    <h3>Coursework</h3>
                    <span className="coursework-count">{coursework.length}</span>
                </div>

                {coursework.length === 0 ? (
                    <div className="coursework-empty">
                        <p>No coursework yet.</p>
                    </div>
                ) : (
                    <ul className="coursework-list">
                        {coursework.map(cw => (
                            <li
                                key={cw.id}
                                className="coursework-item"
                                onClick={() => setSelectedCoursework(cw)}
                            >
                                <div className="coursework-icon">▤</div>
                                <div className="coursework-body">
                                    <div className="coursework-title">{cw.title}</div>
                                    <div className="coursework-due">
                                        <span className="due-label">Due</span>
                                        <span>{formatDue(cw)}</span>
                                    </div>
                                    {cw.description && (
                                        <div className="coursework-desc">{cw.description}</div>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

type AssignmentDetailProps = {
    coursework: GoogleCourseWork;
    onBack: () => void;
};

function AssignmentDetail({ coursework, onBack }: AssignmentDetailProps) {
    const handleOpenInClassroom = () => {
        if (coursework.alternateLink) {
            vscode.postMessage({
                type: 'openExternal',
                url: coursework.alternateLink
            });
        }
    };

    const materials = coursework.materials ?? [];

    return (
        <div className="assignment-detail">
            <header className="assignment-header">
                <button className="assignment-back" onClick={onBack}>
                    ← Back
                </button>
                <h1 className="assignment-title">{coursework.title}</h1>
                <div className="assignment-meta">
                    <span className="assignment-due">
                        Due {formatDue(coursework)}
                    </span>
                    {coursework.state && (
                        <span className="assignment-state">{coursework.state}</span>
                    )}
                </div>
            </header>

            <div className="assignment-body">
                {coursework.description && (
                    <section className="assignment-section">
                        <h3>Description</h3>
                        <p className="assignment-description">{coursework.description}</p>
                    </section>
                )}

                {materials.length > 0 && (
                    <section className="assignment-section">
                        <h3>Attachments</h3>
                        <ul className="assignment-materials">
                            {materials.map((m, i) => {
                                if (m.driveFile?.driveFile) {
                                    const f = m.driveFile.driveFile;
                                    return (
                                        <li key={i}>
                                            <a
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    if (f.alternateLink) {
                                                        vscode.postMessage({
                                                            type: 'openExternal',
                                                            url: f.alternateLink
                                                        });
                                                    }
                                                }}
                                            >
                                                📄 {f.title ?? 'File'}
                                            </a>
                                        </li>
                                    );
                                }
                                if (m.link) {
                                    return (
                                        <li key={i}>
                                            <a
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    if (m.link?.url) {
                                                        vscode.postMessage({
                                                            type: 'openExternal',
                                                            url: m.link.url
                                                        });
                                                    }
                                                }}
                                            >
                                                🔗 {m.link.title ?? m.link.url}
                                            </a>
                                        </li>
                                    );
                                }
                                if (m.youtubeVideo) {
                                    return (
                                        <li key={i}>
                                            <a
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    if (m.youtubeVideo?.alternateLink) {
                                                        vscode.postMessage({
                                                            type: 'openExternal',
                                                            url: m.youtubeVideo.alternateLink
                                                        });
                                                    }
                                                }}
                                            >
                                                ▶ {m.youtubeVideo.title ?? 'Video'}
                                            </a>
                                        </li>
                                    );
                                }
                                if (m.form) {
                                    return (
                                        <li key={i}>
                                            <a
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    if (m.form?.formUrl) {
                                                        vscode.postMessage({
                                                            type: 'openExternal',
                                                            url: m.form.formUrl
                                                        });
                                                    }
                                                }}
                                            >
                                                📝 {m.form.title ?? 'Form'}
                                            </a>
                                        </li>
                                    );
                                }
                                return null;
                            })}
                        </ul>
                    </section>
                )}
            </div>

            <footer className="assignment-footer">
                <button
                    className="assignment-primary"
                    onClick={handleOpenInClassroom}
                    disabled={!coursework.alternateLink}
                >
                    Open in Classroom
                </button>
            </footer>
        </div>
    );
}

export default App;