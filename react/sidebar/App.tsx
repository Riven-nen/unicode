const vscode = acquireVsCodeApi();
function App() {
    const handleGetStarted = () => {
        vscode.postMessage({
            type: "getStarted"
        })
    }

    return (
        <div>
            <h1>Welcome to Unicode</h1>
            <button onClick={handleGetStarted}>Get Started</button>
        </div>
    )
}

export default App