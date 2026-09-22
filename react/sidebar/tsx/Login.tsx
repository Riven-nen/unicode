import '../css/Login.css';

import { vscode } from '../../vscodeApi';

function Login() {
    const handleStartWebview= () => {
        vscode.postMessage({
            type: "startWebview"
        });
    };

    return (
        <div className="sidebar-landing">
            <h1>Welcome to Unicode</h1>
            <p>Access your virtual classroom directly from VS Code.</p>
            <button onClick={handleStartWebview}>Get Started</button>
        </div>
    );
}

export default Login;