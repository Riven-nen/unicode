import { useState } from 'react';
import '../css/Sidebar.css';
import { vscode } from '../../vscodeApi';
import type { GoogleCourse } from '../App';

type UserProfile = {
    name: string;
    role: 'Student' | 'Teacher';
    userId: string;
    picture?: string;
};

type SidebarProps = {
    courses: GoogleCourse[];
    user: UserProfile;
};

function courseColor(id: string): string {
    const palette = [
        '#4285F4',
        '#EA4335',
        '#FBBC04',
        '#34A853',
        '#A142F4',
        '#F439A0',
        '#00ACC1',
        '#FF6D00',
    ];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    }
    return palette[hash % palette.length];
}

function Sidebar({ courses, user }: SidebarProps) {
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const handleLogout = () => {
        vscode.postMessage({ type: 'logout' });
    };

    const handleSubjectClick = (course: GoogleCourse) => {
        setSelectedId(course.id);
        vscode.postMessage({
            type: 'openSubject',
            subject: course.name,
            courseId: course.id,
        });
    };

    const initials = user.name
        .split(' ')
        .map(w => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    return (
        <div className="sidebar-container">
            <div className="sidebar-header">
                {user.picture ? (
                    <img
                        className="sidebar-avatar"
                        src={user.picture}
                        alt={user.name}
                        referrerPolicy="no-referrer"
                    />
                ) : (
                    <div className="sidebar-avatar sidebar-avatar-fallback">
                        {initials}
                    </div>
                )}
                <div className="sidebar-user">
                    <div className="sidebar-user-name">{user.name}</div>
                    <div className="sidebar-user-role">{user.role}</div>
                </div>
            </div>

            <div className="sidebar-top">
                <div className="sidebar-title">
                    <span>My Classes</span>
                    <span className="sidebar-count">{courses.length}</span>
                </div>

                <div className="sidebar-subjects">
                    {courses.map((course) => {
                        const active = selectedId === course.id;
                        return (
                            <button
                                key={course.id}
                                className={
                                    active
                                        ? 'sidebar-subject active'
                                        : 'sidebar-subject'
                                }
                                style={{ ['--course-color' as any]: courseColor(course.id) }}
                                onClick={() => handleSubjectClick(course)}
                            >
                                <span className="subject-indicator" />
                                <span className="subject-name">{course.name}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="sidebar-footer">
                <button className="sidebar-settings">
                    <span className="settings-icon">⚙</span>
                    <span>Settings</span>
                </button>
                <button className="sidebar-logout" onClick={handleLogout}>
                    <span className="settings-icon">↪</span>
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
}

export default Sidebar;