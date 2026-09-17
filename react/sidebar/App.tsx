import Login from './tsx/Login';
import Sidebar from './tsx/Sidebar';
import { useState, useEffect } from 'react';

function App() {
    const [user, setUser] = useState<string | null>(null);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const message = event.data;
            if (message.type === 'authState') {
                setUser(message.user);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    if (!user) return <Login />;
    return <div><Sidebar /></div>;
}

export default App;