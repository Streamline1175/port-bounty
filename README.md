<div align="center">

# 🔪 Process Surgeon

**A cross-platform network port and process management utility for developers**

[![Release](https://img.shields.io/github/v/release/Streamline1175/port-bounty?include_prereleases&style=flat-square)](https://github.com/Streamline1175/port-bounty/releases)
[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey?style=flat-square)]()

[Download](#-download) • [Features](#-features) • [Screenshots](#-screenshots) • [Development](#-development)

</div>

---

## 🎯 What is Process Surgeon?

Ever wondered what's hogging port 3000? Tired of running `lsof -i :PORT` or `netstat -tulpn`? Process Surgeon gives you a beautiful, intuitive interface to:

- 🔍 **Discover** what's using any network port
- 💀 **Kill** processes gracefully or forcefully
- 🐳 **Manage** Docker containers directly
- ⭐ **Track** your favorite ports
- 📊 **Export** data for debugging

## 📥 Download

| Platform | Download | Notes |
|----------|----------|-------|
| **Windows** | [Download .exe](https://github.com/Streamline1175/port-bounty/releases/latest) | Windows 10+ |
| **macOS (Intel)** | [Download .dmg](https://github.com/Streamline1175/port-bounty/releases/latest) | macOS 10.15+ |
| **macOS (Apple Silicon)** | [Download .dmg](https://github.com/Streamline1175/port-bounty/releases/latest) | macOS 11+ |
| **Linux** | [Download .deb](https://github.com/Streamline1175/port-bounty/releases/latest) | Ubuntu/Debian |
| **Linux** | [Download .AppImage](https://github.com/Streamline1175/port-bounty/releases/latest) | Universal |

### Installation Notes

<details>
<summary><b>macOS</b></summary>

1. Download the `.dmg` file for your architecture
2. Open the DMG and drag Process Surgeon to Applications
3. First launch: Right-click the app and select "Open" (Gatekeeper warning)
4. Grant accessibility permissions if prompted

</details>

<details>
<summary><b>Windows</b></summary>

1. Download the `.exe` installer
2. Run the installer (may require admin rights)
3. Launch from Start Menu or Desktop shortcut

</details>

<details>
<summary><b>Linux</b></summary>

**Debian/Ubuntu:**
```bash
sudo dpkg -i process-surgeon_*.deb
```

**AppImage:**
```bash
chmod +x process-surgeon_*.AppImage
./process-surgeon_*.AppImage
```

</details>

## ✨ Features

### Core Features
- **🔍 Port Discovery** - See all processes using network ports
- **⚡ Real-time Updates** - Auto-refresh with configurable intervals
- **💀 Process Management** - Kill processes gracefully (SIGTERM) or force kill (SIGKILL)
- **🐳 Docker Integration** - Manage containers directly (stop, kill)

### User Experience
- **🎯 Port Search** - Quickly find what's using a specific port (`/`)
- **⌨️ Keyboard Shortcuts** - Power-user friendly (`⌘K` to kill, `⌘F` to search)
- **📋 Context Menu** - Right-click for quick actions
- **⭐ Favorites** - Pin commonly monitored ports to the top
- **📜 History** - Track all your actions with timestamps

### Data & Export
- **📊 Export** - Save as JSON or CSV
- **📋 Copy** - Copy PID, port, name, or full details
- **🔍 Search & Filter** - Filter by name, PID, port, protocol, state

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `/` | Open port search |
| `⌘/Ctrl + F` | Focus search bar |
| `⌘/Ctrl + R` | Refresh processes |
| `⌘/Ctrl + K` | Kill selected process |
| `⌘/Ctrl + A` | Select all |
| `Escape` | Close dialogs / Deselect |
| `?` | Show keyboard shortcuts |

## 🛠 Development

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://rustup.rs/) 1.70+
- [Tauri CLI](https://tauri.app/v1/guides/getting-started/prerequisites)

### Setup

```bash
# Clone the repository
git clone https://github.com/Streamline1175/port-bounty.git
cd port-bounty/process-surgeon

# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

### Project Structure

```
process-surgeon/
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── store/              # Zustand state
│   ├── hooks/              # Custom hooks
│   └── types/              # TypeScript types
├── src-tauri/              # Rust backend
│   └── src/
│       ├── discovery/      # Port scanning
│       ├── docker/         # Docker integration
│       └── surgery/        # Process management
└── package.json
```

### Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Zustand
- **Backend**: Rust, Tauri v2
- **Key Crates**: sysinfo, netstat2, bollard (Docker)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](process-surgeon/LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Tauri](https://tauri.app/)
- Icons from [Lucide](https://lucide.dev/)
- Inspired by the need to stop Googling "how to kill process on port"

---

<div align="center">

**[⬆ Back to top](#-process-surgeon)**

Made with ❤️ by [Streamline1175](https://github.com/Streamline1175)

</div>