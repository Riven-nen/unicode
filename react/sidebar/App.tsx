function App() {
    const handleGetStarted = () => {
        const vscode = acquireVsCodeApi()

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