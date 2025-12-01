import { app, BrowserWindow, ipcMain, screen, desktopCapturer, dialog, Tray, Menu, nativeImage } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const ffmpeg = require('fluent-ffmpeg')
const ffmpegPath = require('ffmpeg-static')

// Set ffmpeg path
if (ffmpegPath) {
    ffmpeg.setFfmpegPath(ffmpegPath.replace('app.asar', 'app.asar.unpacked'))
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(__dirname, '../public')

let win: BrowserWindow | null
let tray: Tray | null = null
let pauseTray: Tray | null = null
let stopTray: Tray | null = null

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

// ... (createWindow function remains same)

function createWindow() {
    win = new BrowserWindow({
        width: 1200,
        height: 800,
        icon: path.join(process.env.VITE_PUBLIC || '', 'icon.png'),
        frame: false,
        transparent: true,
        vibrancy: 'hud',
        visualEffectState: 'active',
        webPreferences: {
            preload: path.join(__dirname, 'preload.mjs'),
            nodeIntegration: false,
            contextIsolation: true,
            backgroundThrottling: false,
        },
    })

    win.webContents.on('did-finish-load', () => {
        win?.webContents.send('main-process-message', (new Date).toLocaleString())
    })

    if (VITE_DEV_SERVER_URL) {
        win.loadURL(VITE_DEV_SERVER_URL)
    } else {
        win.loadFile(path.join(process.env.DIST || '', 'index.html'))
    }
}

// Icon Generators
const createPauseIcon = () => {
    console.log('Creating Pause Icon from file')
    const size = 22
    const iconPath = path.join(process.env.VITE_PUBLIC || '', 'tray-pause.png')
    const img = nativeImage.createFromPath(iconPath).resize({ width: size, height: size })
    console.log('Pause Icon Empty?', img.isEmpty())
    img.setTemplateImage(true)
    return img
}

const createPlayIcon = () => {
    const size = 22
    const iconPath = path.join(process.env.VITE_PUBLIC || '', 'tray-play.png')
    const img = nativeImage.createFromPath(iconPath).resize({ width: size, height: size })
    img.setTemplateImage(true)
    return img
}

const createStopIcon = () => {
    console.log('Creating Stop Icon from file')
    const size = 22
    const iconPath = path.join(process.env.VITE_PUBLIC || '', 'tray-stop.png')
    const img = nativeImage.createFromPath(iconPath).resize({ width: size, height: size })
    console.log('Stop Icon Empty?', img.isEmpty())
    img.setTemplateImage(true)
    return img
}

function createTray() {
    const iconPath = path.join(process.env.VITE_PUBLIC || '', 'logo.png')
    console.log('Creating Main Tray Icon from:', iconPath)
    const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })
    console.log('Main Icon Empty?', icon.isEmpty())

    tray = new Tray(icon)
    tray.setToolTip('The Recorder Project')
    updateMenus(false, false)
}

function updateMenus(isRecording: boolean, isPaused: boolean) {
    // 1. Main Tray
    if (tray) {
        const trayMenu = Menu.buildFromTemplate([
            { label: 'The Recorder Project', enabled: false },
            { type: 'separator' },
            { label: 'Show Window', click: () => win?.show() },
            { label: 'Quit', click: () => app.quit() }
        ])
        tray.setContextMenu(trayMenu)
    }

    // 2. Direct Control Trays
    if (isRecording) {
        // PAUSE/PLAY TRAY
        if (!pauseTray) {
            pauseTray = new Tray(createPauseIcon())
            pauseTray.on('click', () => win?.webContents.send('tray-pause'))
        }

        // Update Icon based on state
        if (isPaused) {
            pauseTray.setImage(createPlayIcon())
            pauseTray.setToolTip('Resume Recording')
        } else {
            pauseTray.setImage(createPauseIcon())
            pauseTray.setToolTip('Pause Recording')
        }

        // STOP TRAY
        if (!stopTray) {
            stopTray = new Tray(createStopIcon())
            stopTray.setToolTip('Stop Recording')
            stopTray.on('click', () => win?.webContents.send('tray-stop'))
        }
    } else {
        // Cleanup trays when not recording
        if (pauseTray) {
            pauseTray.destroy()
            pauseTray = null
        }
        if (stopTray) {
            stopTray.destroy()
            stopTray = null
        }
    }

    // 3. Application Menu
    const appMenu = Menu.buildFromTemplate([
        {
            label: app.name,
            submenu: [
                { role: 'about' },
                { type: 'separator' },
                { role: 'services' },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideOthers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' }
            ]
        },
        {
            label: 'Recording',
            submenu: [
                {
                    label: isPaused ? 'Resume' : 'Pause',
                    accelerator: 'CmdOrCtrl+P',
                    enabled: isRecording,
                    click: () => win?.webContents.send('tray-pause')
                },
                {
                    label: 'Stop',
                    accelerator: 'CmdOrCtrl+S',
                    enabled: isRecording,
                    click: () => win?.webContents.send('tray-stop')
                }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        }
    ])
    Menu.setApplicationMenu(appMenu)
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

app.whenReady().then(() => {
    createWindow()
    createTray()

    // Mouse polling
    setInterval(() => {
        if (win && !win.isDestroyed()) {
            const point = screen.getCursorScreenPoint()
            win.webContents.send('mouse-position', point)
        }
    }, 16)

    ipcMain.handle('get-sources', async () => {
        const sources = await desktopCapturer.getSources({ types: ['screen', 'window'], thumbnailSize: { width: 320, height: 180 } })
        return sources.map(source => ({
            id: source.id,
            name: source.name,
            thumbnail: source.thumbnail.toDataURL(),
            appIcon: source.appIcon?.toDataURL()
        }))
    })

    ipcMain.handle('save-video', async (event, buffer) => {
        const { filePath } = await dialog.showSaveDialog(win!, {
            buttonLabel: 'Save video',
            defaultPath: `recording-${Date.now()}.webm`
        })

        if (filePath) {
            fs.writeFileSync(filePath, Buffer.from(buffer))
            return true
        }
        return false
    })

    // FFmpeg Processing
    ipcMain.handle('process-video', async (event, { buffer, options }) => {
        const tempInput = path.join(app.getPath('temp'), `input-${Date.now()}.webm`)
        const tempOutput = path.join(app.getPath('temp'), `output-${Date.now()}.mp4`)

        fs.writeFileSync(tempInput, Buffer.from(buffer))

        return new Promise((resolve, reject) => {
            let command = ffmpeg(tempInput)

            // Trim
            if (options.trim) {
                command = command.setStartTime(options.trim.start).setDuration(options.trim.end - options.trim.start)
            }

            // Crop
            if (options.crop) {
                command = command.videoFilters(`crop=${options.crop.w}:${options.crop.h}:${options.crop.x}:${options.crop.y}`)
            }

            // Blur (simple boxblur for demo, applied to whole video if enabled)
            // In a real editor, we'd need complex filter_complex for region blur
            if (options.blur) {
                command = command.videoFilters(`boxblur=10:1`)
            }

            command
                .output(tempOutput)
                .on('end', () => {
                    const outputBuffer = fs.readFileSync(tempOutput)
                    // Cleanup
                    try { fs.unlinkSync(tempInput); fs.unlinkSync(tempOutput) } catch (e) { }
                    resolve(outputBuffer)
                })
                .on('error', (err: any) => {
                    console.error('FFmpeg error:', err)
                    reject(err)
                })
                .run()
        })
    })

    ipcMain.on('recording-state-changed', (event, { isRecording, isPaused }) => {
        updateMenus(isRecording, isPaused)
    })

    // [NEW] Global Mouse Hook
    const { uIOhook, UiohookKey } = require('uiohook-napi')

    uIOhook.on('mousedown', (e: any) => {
        if (win && !win.isDestroyed()) {
            win.webContents.send('mouse-click')
        }
    })

    uIOhook.on('keydown', (e: any) => {
        if (win && !win.isDestroyed()) {
            win.webContents.send('keyboard-event')
        }
    })

    uIOhook.start()
})
