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
    room?: string;
    ownerId?: string;
};

type GoogleCourseWork = {
    id: string;
    title: string;
    description?: string;
    dueDate?: { year: number; month: number; day: number };
    dueTime?: { hours: number; minutes: number };
    state?: string;
    alternateLink?: string;
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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const message = event.data;
            if (message.type === 'authState') {
                setUser(message.user);
                setLoading(false);
            }
            if (message.type === 'currentCourse') setCourse(message.course);
            if (message.type === 'coursework') setCoursework(message.coursework);
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

    return (
        <div className="main-container">
            <header className="main-banner">
                <div className="banner-content">
                    <h1 className="banner-title">{course.name}</h1>
                    <div className="banner-meta">
                        {course.section && <span>{course.section}</span>}
                        {course.room && (
                            <>
                                <span className="banner-dot">·</span>
                                <span>{course.room}</span>
                            </>
                        )}
                    </div>
                </div>
                <div className="banner-actions">
                    <button className="banner-btn" title="Course options">⋯</button>
                </div>
            </header>

            <nav className="main-tabs">
                <button className="main-tab active">Coursework</button>
                <button className="main-tab">People</button>
                <button className="main-tab">Grades</button>
            </nav>

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
                            <li key={cw.id} className="coursework-item">
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

export default App;