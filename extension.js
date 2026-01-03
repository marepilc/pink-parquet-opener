const vscode = require("vscode");
const { spawn, execSync } = require("child_process");

const fs = require("fs");

console.log("Pink Parquet Opener extension loading...");
function activate(context) {
  console.log("Pink Parquet Opener is now active!");

  // Register command
  let disposable = vscode.commands.registerCommand(
    "pinkparquet.open",
    async (uri) => {
      try {
        // Get the file URI
        if (!uri) {
          // Try to get from active editor
          const activeEditor = vscode.window.activeTextEditor;
          if (
            activeEditor &&
            activeEditor.document.fileName.toLowerCase().endsWith(".parquet")
          ) {
            uri = activeEditor.document.uri;
          } else {
            vscode.window.showErrorMessage("Please select a .parquet file");
            return;
          }
        }

        // Get configuration
        const config = vscode.workspace.getConfiguration("pinkParquet");
        const exePath = config.get("executablePath");

        if (!exePath) {
          vscode.window.showErrorMessage("Pink Parquet executable path is not configured.");
          return;
        }

        // Handle different environments
        let filePath = uri.fsPath;
        console.log(`Original uri.fsPath: ${filePath}`);
        console.log(`uri.scheme: ${uri.scheme}`);
        console.log(`uri.path: ${uri.path}`);
        console.log(`uri.authority: ${uri.authority}`);

        // If running in WSL or remote, we need to be careful
        const isRemote = uri.scheme === 'vscode-remote';
        const isWslRemote = isRemote && uri.authority.startsWith('wsl+');
        
        console.log(`isRemote: ${isRemote}, isWslRemote: ${isWslRemote}`);

        // If running in WSL, convert path
        if (process.platform === "linux" || isWslRemote) {
          try {
            // Check if we are actually in WSL
            let isWsl = false;
            if (fs.existsSync('/proc/version')) {
              const version = fs.readFileSync('/proc/version', 'utf8').toLowerCase();
              isWsl = version.includes('microsoft');
            }

            if (isWsl || isWslRemote) {
              console.log("Detected WSL environment");
              let distroName = process.env.WSL_DISTRO_NAME || "";
              
              if (isWslRemote && !distroName) {
                // For vscode-remote, authority is often wsl+Ubuntu-24.04
                distroName = uri.authority.replace('wsl+', '');
              }
              
              console.log(`WSL Distro: ${distroName}`);

              // If it's a remote URI, fsPath might be just the Linux path (e.g. /home/user/file.parquet)
              // We want to make sure we use uri.path if fsPath isn't what we expect
              if (isWslRemote) {
                filePath = uri.path;
                console.log(`Using uri.path for remote: ${filePath}`);
              }

              // Convert the parquet file path to Windows path for the Windows executable
              try {
                // If we are on Linux (WSL side), we can use wslpath
                if (process.platform === "linux") {
                  const convertedPath = execSync(`wslpath -w "${filePath}"`, {
                    encoding: "utf8",
                  }).trim();
                  console.log(`wslpath -w returned: ${convertedPath}`);
                  if (convertedPath) {
                    filePath = convertedPath;
                  }
                } else if (isWslRemote && distroName) {
                  // If we are on Windows side (extensionKind UI) but it's a WSL remote file
                  filePath = `\\\\wsl.localhost\\${distroName}${filePath.replace(/\//g, "\\")}`;
                  console.log(`Constructed WSL path from Windows side: ${filePath}`);
                }
              } catch (convErr) {
                console.error("wslpath conversion failed:", convErr);
                
                // Fallback: manually construct the path if we have the distro name
                if (distroName && filePath.startsWith("/")) {
                   filePath = `\\\\wsl.localhost\\${distroName}${filePath.replace(/\//g, "\\")}`;
                   console.log(`Manually constructed WSL path: ${filePath}`);
                }
              }

              // Ensure we use \\wsl.localhost\ instead of \\wsl$\
              if (filePath.startsWith("\\\\wsl$\\")) {
                filePath = filePath.replace("\\\\wsl$\\", "\\\\wsl.localhost\\");
                console.log(`Converted \\wsl$\\ to \\wsl.localhost\\: ${filePath}`);
              } else if (filePath.startsWith("/")) {
                // If it's still a Linux path and we didn't fallback yet
                if (filePath.startsWith("/mnt/") && filePath.length > 5) {
                  // Handle /mnt/c/... -> C:\...
                  const drive = filePath[5].toUpperCase();
                  filePath = `${drive}:${filePath.substring(6).replace(/\//g, "\\")}`;
                  console.log(`Manually converted /mnt/ path: ${filePath}`);
                } else if (distroName) {
                  filePath = `\\\\wsl.localhost\\${distroName}${filePath.replace(/\//g, "\\")}`;
                  console.log(`Manually constructed WSL path (after wslpath failed to convert): ${filePath}`);
                }
              }
            }
          } catch (e) {
            console.error("Error during WSL detection:", e);
          }
        }

        console.log(`Launching Pink Parquet with path: ${filePath}`);

        // Execute Pink Parquet
        let child;
        if (process.platform === "win32") {
          // Use spawn for Windows to handle spaces in paths correctly
          child = spawn(exePath, [filePath], {
            detached: true,
            stdio: 'ignore'
          });
          child.unref();
        } else {
          // Fallback for WSL/Linux
          // Use cmd.exe /c start to launch Windows applications from WSL
          // This is more robust than calling powershell.exe directly
          const command = `cmd.exe`;
          // Note: The empty double quotes after 'start' are for the title argument of start command
          // We wrap the paths in double quotes to handle spaces
          const args = ["/c", "start", "", exePath, filePath];
          
          console.log(`Executing: ${command} ${args.map(arg => `"${arg}"`).join(' ')}`);
          
          child = spawn(command, args, {
            detached: true,
            stdio: 'ignore'
          });
          child.unref();
        }

        child.on('error', (error) => {
          vscode.window.showErrorMessage(
            `Failed to open Pink Parquet: ${error.message}`
          );
          console.error("Error:", error);
        });

      } catch (error) {
        vscode.window.showErrorMessage(`Error: ${error.message}`);
      }
    }
  );

  context.subscriptions.push(disposable);

  // Register status bar item
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.command = "pinkparquet.open";
  statusBarItem.text = "$(file-binary) Open in Pink Parquet";
  statusBarItem.tooltip = "Open current file in Pink Parquet";

  // Show only for parquet files
  function updateStatusBar() {
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor && activeEditor.document.fileName.toLowerCase().endsWith(".parquet")) {
      statusBarItem.show();
    } else {
      statusBarItem.hide();
    }
  }

  // Update on editor change
  vscode.window.onDidChangeActiveTextEditor(
    updateStatusBar,
    null,
    context.subscriptions
  );
  updateStatusBar();

  context.subscriptions.push(statusBarItem);
}

function deactivate() {
  console.log("Pink Parquet Opener is now deactivated");
}

module.exports = {
  activate,
  deactivate,
};
