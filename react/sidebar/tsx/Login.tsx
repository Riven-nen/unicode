import '../css/Login.css';

const vscode = acquireVsCodeApi();

function Login() {
    const handleGetStarted = () => {
        vscode.postMessage({
            type: "getStarted"
        });
    };

    return (
        <div className="sidebar-landing">
            <h1>Welcome to Unicode</h1>
            <p>Access your virtual classroom directly from VS Code.</p>
            <button onClick={handleGetStarted}>Get Started</button>
        </div>
    );
}

export default Login;