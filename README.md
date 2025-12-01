# The Recorder Project

**Every Recording turns into your product launch.**

A cinematic screen recorder built for creators, developers, and marketers. "The Recorder Project" automatically adds professional polish to your screen captures, making them ready for product launches, tutorials, and demos without hours of editing.

## Features

- **Cinematic Auto-Zoom**: Automatically zooms in on your cursor actions to highlight important details, just like a professional editor would.
- **4K 60FPS Recording**: Capture crystal clear, high-frame-rate video suitable for any platform.
- **Mouse Tracking & Smoothing**: Eliminates jittery mouse movements for a polished look.
- **Built-in Video Editor**: Trim, crop, and apply effects directly within the app.
- **Global Hotkeys & Tray Control**: Start, pause, and stop recordings from anywhere.
- **Cross-Platform Foundation**: Built with Electron, React, and TypeScript for future cross-platform support (currently optimized for macOS).

## Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/iamvaar-dev/the_recorder_project.git
    cd the_recorder_project
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run in development mode:**
    ```bash
    npm run dev
    ```

4.  **Build for production:**
    ```bash
    npm run dist
    ```

## Usage

1.  Launch the application.
2.  Click **Start Recording**.
3.  Select the screen or window you want to capture.
4.  A 3-second countdown will begin.
5.  Perform your demo or tutorial. The app will automatically track your mouse and zoom in on clicks and typing.
6.  Click the **Stop** button in the tray or use the global hotkey to finish.
7.  Review and edit your recording in the built-in editor.
8.  Save your cinematic video.

## Competitor Comparison

We believe "The Recorder Project" offers the best balance of professional quality and ease of use for creators who want "Screen Studio" quality without the subscription.

| Feature | The Recorder Project | Screen Studio | OBS Studio | Loom |
| :--- | :--- | :--- | :--- | :--- |
| **Primary Use Case** | Cinematic Product Demos | Cinematic Product Demos | Live Streaming & Recording | Quick Video Messaging |
| **Cinematic Auto-Zoom** | ✅ **Yes (Built-in)** | ✅ Yes | ❌ No (Requires plugins/manual) | ❌ No |
| **Mouse Smoothing** | ✅ **Yes** | ✅ Yes | ❌ No | ❌ No |
| **Video Quality** | **4K 60FPS** | 4K 60FPS | Customizable (High) | Up to 4K (Paid) |
| **Editing** | **Built-in (Trim, Crop, Blur)** | Advanced Built-in | None (Recording only) | Basic (Trim) |
| **Ease of Use** | **High (One-click)** | High | Low (Steep learning curve) | Very High |
| **Price** | **Open Source (Free)** | Paid (Subscription/One-time) | Free (Open Source) | Freemium (Subscription) |
| **Platform** | **macOS (Windows/Linux coming)** | macOS only | Windows, macOS, Linux | Web, Mac, Windows, Mobile |

## Tech Stack

-   **Electron**: Desktop application framework.
-   **React**: UI library.
-   **TypeScript**: Type-safe code.
-   **Vite**: Fast build tool.
-   **FFmpeg**: Video processing engine.
-   **Zustand**: State management.
-   **Ant Design**: UI component library.
