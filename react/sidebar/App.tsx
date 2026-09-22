import Login from './tsx/Login';
import Sidebar from './tsx/Sidebar';
import { useState, useEffect } from 'react';
import { vscode } from '../vscodeApi';

type UserProfile = {
    name: string;
    role: 'Student' | 'Teacher';
    userId: string;
};

function App() {
    const [user, setUser] = useState<UserProfile | null>(null);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const message = event.data;
            if (message.type === 'authState') {
                setUser(message.user);
            }
        };

        window.addEventListener('message', handleMessage);
        vscode.postMessage({ type: 'ready' });

        return () => window.removeEventListener('message', handleMessage);
    }, []);

    if (!user) return <Login />;
    return <div><Sidebar /></div>;
}

export default App;