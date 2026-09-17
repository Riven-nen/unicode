import { useState } from 'react';
import '../css/Sidebar.css';

function Sidebar() {
    const [selectedSubject, setSelectedSubject] = useState('Programming 1');
    // hardcoded for now
    const subjects = [
        'Programming 1',
        'Web Development',
        'Database Systems',
        'Networking'
    ];

    return (
        <div className="sidebar-container">
            <div className="sidebar-top">
                <div className="sidebar-title">
                    <span>MY CLASSES</span>
                    <span className="sidebar-count">{subjects.length}</span>
                </div>

                <div className="sidebar-subjects">
                    {subjects.map((subject) => (
                        <button
                            key={subject}
                            className={
                                selectedSubject === subject
                                    ? 'sidebar-subject active'
                                    : 'sidebar-subject'
                            }
                            onClick={() => setSelectedSubject(subject)}
                        >
                            <span className="subject-indicator" />
                            <span className="subject-name">{subject}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="sidebar-footer">
                <button className="sidebar-settings">
                    <span className="settings-icon">⚙</span>
                    <span>Settings</span>
                </button>
            </div>
        </div>
    );
}

export default Sidebar;