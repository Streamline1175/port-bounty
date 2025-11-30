# Changelog

All notable changes to Process Surgeon will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0-beta.1] - 2025-11-30

### Added

#### Core Features
- **Port Discovery**: Scan and display all processes using network ports
- **Process Management**: Kill processes gracefully (SIGTERM) or forcefully (SIGKILL)
- **Docker Integration**: Manage Docker containers directly from the app
- **Real-time Updates**: Auto-refresh with configurable polling interval (1s, 2s, 5s, 10s)

#### User Interface
- **Process Table**: Sortable table with process name, PID, ports, memory, CPU, and user
- **Port Indicators**: Visual badges showing port number, protocol (TCP/UDP), and state
- **Search & Filter**: Filter by process name, PID, port number, or command line
- **Protocol Filter**: Filter by TCP, UDP, or all protocols
- **State Filter**: Filter by connection state (LISTEN, ESTABLISHED, etc.)
- **Dark Mode**: Automatic dark mode support

#### New Features
- **Port Search Dialog** (`/`): Quick lookup for what's using a specific port
- **Context Menu**: Right-click menu with copy, favorite, and kill actions
- **Keyboard Shortcuts**: 
  - `⌘/Ctrl + K` - Kill selected process
  - `⌘/Ctrl + F` - Focus search
  - `⌘/Ctrl + R` - Refresh processes
  - `/` - Open port search
  - `?` - Show keyboard shortcuts
  - `Escape` - Close dialogs
- **Process Details Panel**: Slide-out panel with full process information
- **Favorites**: Pin commonly monitored ports to the top of the list
- **History/Audit Log**: Track all kill actions with timestamps and results
- **Export**: Export process list as JSON or CSV
- **Copy Actions**: Copy PID, port, name, or full process details

#### Technical
- Built with Tauri v2 for native performance
- React 19 frontend with Zustand state management
- Rust backend using `sysinfo`, `netstat2`, and `bollard` crates
- Cross-platform support for Windows, macOS, and Linux

### Known Issues
- Docker integration requires Docker daemon to be running
- Some system processes may show limited information due to permissions
- macOS users may need to grant accessibility permissions for full functionality

### Security Notes
- The app requires elevated permissions to kill system processes
- Protected processes (kernel, init, etc.) cannot be terminated
- All kill actions are logged locally for audit purposes
