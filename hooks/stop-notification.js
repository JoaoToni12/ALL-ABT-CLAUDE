// Notification hook: Sends a toast notification when Claude finishes a task
// Triggered on: Stop event
// Cross-platform: PowerShell (Windows), osascript (macOS), notify-send (Linux)
const { shouldRun } = require(
  require("path").join(__dirname, "hook-profile-check"),
);
const { execFileSync } = require("child_process");
const os = require("os");

let data = "";
process.stdin.on("data", (chunk) => (data += chunk));
process.stdin.on("end", () => {
  try {
    const input = JSON.parse(data);

    if (!shouldRun("stop-notification", "standard").shouldRun) {
      return;
    }

    const reason = input.stop_reason || input.reason || "Task completed";
    const title = "Claude Code";
    const body =
      typeof reason === "string" ? reason.slice(0, 200) : "Task completed";
    const platform = os.platform();

    try {
      if (platform === "win32") {
        const ps = `
          Add-Type -AssemblyName System.Windows.Forms
          $balloon = New-Object System.Windows.Forms.NotifyIcon
          $balloon.Icon = [System.Drawing.SystemIcons]::Information
          $balloon.BalloonTipTitle = $env:NOTIFY_TITLE
          $balloon.BalloonTipText = $env:NOTIFY_BODY
          $balloon.Visible = $true
          $balloon.ShowBalloonTip(5000)
          Start-Sleep -Milliseconds 5100
          $balloon.Dispose()
        `.trim();
        execFileSync(
          "powershell.exe",
          ["-NoProfile", "-NonInteractive", "-Command", ps],
          {
            timeout: 10000,
            stdio: ["pipe", "pipe", "pipe"],
            windowsHide: true,
            env: { ...process.env, NOTIFY_TITLE: title, NOTIFY_BODY: body },
          },
        );
      } else if (platform === "darwin") {
        execFileSync(
          "osascript",
          ["-e", `display notification "${body}" with title "${title}"`],
          {
            timeout: 10000,
            stdio: ["pipe", "pipe", "pipe"],
          },
        );
      } else {
        execFileSync("notify-send", [title, body], {
          timeout: 10000,
          stdio: ["pipe", "pipe", "pipe"],
        });
      }
    } catch {
      // Notification failed — not critical, skip silently
    }
  } catch {
    // Parse error — skip silently
  }
});
