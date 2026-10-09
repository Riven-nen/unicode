import Login from './tsx/Login';
import Sidebar from './tsx/Sidebar';
import { vscode } from '../vscodeApi';
import { useEffect, useState } from 'react';

type UserProfile = {
    name: string;
    role: 'Student' | 'Teacher';
    userId: string;
    picture?: string;
    email: string;
};

export type GoogleCourse = {
    id: string;
    name: string;
    section?: string;
    room?: string;
    ownerId?: string;
};

function App() {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [courses, setCourses] = useState<GoogleCourse[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const message = event.data;
            if (message.type === 'authState') {
                setUser(message.user);
                setLoading(false);
            }
            if (message.type === 'courses') {
                setCourses(message.courses);
            }
        };

        window.addEventListener('message', handleMessage);
        vscode.postMessage({ type: 'ready' });

        return () => window.removeEventListener('message', handleMessage);
    }, []);

    if (loading) return <div className="app-loading" />;
    if (!user) return <Login />;
    return <div><Sidebar courses={courses} user={user} /></div>;
}

export default App;