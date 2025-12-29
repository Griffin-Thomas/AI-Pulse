<p align="center">
  <img src="docs/assets/logo.png" alt="AI Pulse Logo" width="128" height="128">
</p>

<h1 align="center">AI Pulse</h1>

<p align="center">
  <strong>Monitor your AI service usage quotas from the system tray</strong>
</p>

<p align="center">
  <a href="https://github.com/Griffin-Thomas/AI-Pulse/releases"><img src="https://img.shields.io/github/v/release/Griffin-Thomas/AI-Pulse?style=flat-square&color=blue" alt="Latest Release"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/Griffin-Thomas/AI-Pulse?style=flat-square" alt="License"></a>
  <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey?style=flat-square" alt="Platform">
</p>

<p align="center">
  A cross-platform desktop application for monitoring AI service usage quotas (Claude for now)
</p>

---

<p align="center">
  <img src="docs/assets/usage.png" alt="AI Pulse Dashboard Usage" width="400">
  <img src="docs/assets/analytics.png" alt="AI Pulse Dashboard Analytics" width="400">
</p>

<p align="center">
  <img src="docs/assets/usage_dark.png" alt="AI Pulse Dashboard Usage" width="400">
  <img src="docs/assets/analytics_dark.png" alt="AI Pulse Dashboard Analytics" width="400">
</p>

## Features

- **Real-time Usage Tracking** - Monitor your Claude usage limits
- **Multi-Account Support** - Track multiple Claude accounts (work, personal, etc.)
- **System Tray Integration** - Dynamic progress ring icon shows usage at a glance
- **Smart Notifications** - Alerts at configurable usage thresholds
- **Background Refresh** - Automatic usage updates with adaptive intervals
- **Usage Analytics** - Historical trends, heatmaps, and usage patterns
- **Auto-Updates** - Automatic update checks with one-click install
- **Cross-platform** - macOS, Linux, Windows

## Installation

### macOS

1. Download the `.dmg` file from [Releases](https://github.com/Griffin-Thomas/AI-Pulse/releases)
2. Open the `.dmg` and drag AI Pulse to your Applications folder
3. Before opening, run this command to remove the quarantine attribute (required for unsigned apps):
   ```bash
   xattr -cr "/Applications/AI Pulse.app"
   ```
4. Open AI Pulse from Applications

### Windows

Download and run the `.exe` installer from [Releases](https://github.com/Griffin-Thomas/AI-Pulse/releases).

### Linux

Download the `.AppImage` from [Releases](https://github.com/Griffin-Thomas/AI-Pulse/releases), make it executable, and run it.

## Configure Credentials

1. Click the **Settings** icon (gear) in the app header
2. Click **Add Account** in the Accounts section
3. Enter your Claude credentials:
   - **Account Name**: A friendly name (e.g., "Personal", "Work")
   - **Organization ID**: Found in your Claude.ai URL (`claude.ai/settings/organization/[org-id]`)
   - **Session Key**: Found in browser DevTools → Application → Cookies → `sessionKey`
4. Click **Test** to verify the connection, then **Add Account**

You can add multiple accounts to track usage across different Claude subscriptions.

For detailed instructions, see the [User Guide](docs/user-guide.md).

## Tech Stack

- **Tauri v2** - Cross-platform framework (Rust backend)
- **React 19 + TypeScript** - Frontend UI
- **shadcn/ui + Tailwind CSS v4** - Components and styling
- **Zustand** - State management

See the [Changelog](CHANGELOG.md) for version history.

## Support

<a href="https://buymeacoffee.com/griffinthomas">
  <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" width="180">
</a>

## License

MIT
