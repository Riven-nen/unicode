import Logo from '../../pics/logo-white.png';
import '../css/Landing.css';

const vscode = acquireVsCodeApi();

function Landing() {
    const handleGetStarted = () => {
        vscode.postMessage({
            type: 'getStarted'
        });
    };

    return (
        <div className="landing-main-container">
            <img className="landing-logo" src={Logo} alt="Unicode logo" />

            <h1>Welcome to Unicode</h1>

            <p className="landing-subtitle">
                Your virtual classroom, integrated directly into VS Code.
            </p>

            <button id="sign-in-google" onClick={handleGetStarted}>
                <svg viewBox="0 0 24 24" width="18" height="18">
                    <path fill="#4285F4" d="M21.35 12.23c0-.79-.07-1.55-.2-2.27H12v4.3h5.22a4.45 4.45 0 0 1-1.93 2.92v2.43h3.13c1.83-1.69 2.93-4.18 2.93-7.38z"/>
                    <path fill="#34A853" d="M12 21.5c2.62 0 4.82-.87 6.42-2.36l-3.13-2.43c-.87.58-1.98.92-3.29.92-2.53 0-4.68-1.71-5.45-4.01H3.31v2.51A9.7 9.7 0 0 0 12 21.5z"/>
                    <path fill="#FBBC05" d="M6.55 13.62A5.84 5.84 0 0 1 6.24 12c0-.56.1-1.1.31-1.62V7.87H3.31A9.48 9.48 0 0 0 2.5 12c0 1.53.37 2.98.81 4.13l3.24-2.51z"/>
                    <path fill="#EA4335" d="M12 6.37c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.82 3.42 14.62 2.5 12 2.5a9.7 9.7 0 0 0-8.69 5.37l3.24 2.51C7.32 8.08 9.47 6.37 12 6.37z"/>
                </svg>
                <span>Sign in with Google</span>
            </button>

            <p className="landing-note">
                Access your classes and assignments directly from your workspace.
            </p>
        </div>
    );
}

export default Landing;