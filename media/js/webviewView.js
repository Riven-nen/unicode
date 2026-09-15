const vscode = acquireVsCodeApi();

document.getElementById("getStarted").addEventListener("click", () => {
    vscode.postMessage({
        type: "getStarted"
    });
});