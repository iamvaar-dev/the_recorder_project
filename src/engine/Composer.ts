export class Composer {
    private canvas: HTMLCanvasElement
    private ctx: CanvasRenderingContext2D
    private video: HTMLVideoElement
    private rafId: number | null = null

    // Camera State for smooth zoom/pan
    private camera = { x: 0, y: 0, zoom: 1 }
    private target = { x: 0, y: 0, zoom: 1 }

    // Config
    private zoomIdleLevel = 1.0 // Normal zoom
    private zoomActiveLevel = 1.5 // 50% zoom for better focus

    // Advanced Config
    private deadZone = 100 // Camera movement deadzone (unchanged)
    private activityDeadZone = 60 // [NEW] Ignore movements smaller than 60px for "activity"
    private idleThreshold = 2000 // 2s wait before zooming out
    private lastActiveTime = 0
    private isZoomedIn = false
    private isClickZoomed = false // [NEW] Track if we are in "click zoom" mode
    private clickZoomLevel = 2.0 // [NEW] Zoom level for clicks

    private lastMousePos = { x: 0, y: 0 }
    private isFirstMouseUpdate = true // [NEW] Track first mouse update to prevent initial zoom jump

    constructor() {
        this.canvas = document.createElement('canvas')
        this.ctx = this.canvas.getContext('2d', {
            alpha: false,
            desynchronized: true // Better performance
        })!

        this.video = document.createElement('video')
        this.video.autoplay = true
        this.video.muted = true
    }

    async start(stream: MediaStream) {
        this.video.srcObject = stream
        await this.video.play()

        // Wait for video to have dimensions
        await new Promise<void>(resolve => {
            const check = () => {
                if (this.video.videoWidth > 0) {
                    resolve()
                } else {
                    setTimeout(check, 10)
                }
            }
            check()
        })

        // Set canvas to match video resolution
        this.canvas.width = this.video.videoWidth
        this.canvas.height = this.video.videoHeight

        // Initialize camera to center
        this.camera.x = this.canvas.width / 2
        this.camera.y = this.canvas.height / 2
        this.camera.zoom = 1 // Start at full screen

        this.target.x = this.canvas.width / 2
        this.target.y = this.canvas.height / 2
        this.target.zoom = 1 // Start at full screen

        // Reset state to ensure we start in "Idle" mode
        this.lastActiveTime = 0
        this.isZoomedIn = false
        this.isClickZoomed = false
        this.isFirstMouseUpdate = true // Reset on start

        this.startLoop()
    }

    stop() {
        this.stopLoop()
        this.video.srcObject = null
    }

    // [NEW] Handle global click event
    handleClick() {
        // When clicked, zoom in deeper (2x) and snap to current mouse position
        this.isClickZoomed = true
        this.isZoomedIn = true
        this.lastActiveTime = Date.now() // Reset idle timer

        // We use the last known mouse position for the target
        this.target.x = this.lastMousePos.x
        this.target.y = this.lastMousePos.y
        this.target.zoom = this.clickZoomLevel
    }

    // [NEW] Handle global key event (typing)
    handleKey() {
        // Typing counts as activity, so we reset the idle timer
        // This prevents zooming out while the user is typing
        this.lastActiveTime = Date.now()
    }

    updateMousePosition(x: number, y: number) {
        // Calculate scale factor between logical screen size and video resolution
        const scaleX = this.canvas.width / window.screen.width
        const scaleY = this.canvas.height / window.screen.height

        const scaledX = x * scaleX
        const scaledY = y * scaleY

        const now = Date.now()

        // [NEW] Handle first mouse update to prevent instant zoom
        if (this.isFirstMouseUpdate) {
            this.lastMousePos = { x: scaledX, y: scaledY }
            this.isFirstMouseUpdate = false
            return // Don't trigger movement or activity on the very first frame
        }

        // ACTIVITY CHECK: Track movement to prevent zoom out
        // [MODIFIED] Increased threshold to ignore micro-movements
        const dx = Math.abs(scaledX - this.lastMousePos.x)
        const dy = Math.abs(scaledY - this.lastMousePos.y)

        if (dx > this.activityDeadZone || dy > this.activityDeadZone) {
            this.lastActiveTime = now
            this.lastMousePos = { x: scaledX, y: scaledY }

            // [NEW] If we move significantly while click-zoomed, break out of it
            if (this.isClickZoomed) {
                // If moved more than 20px (arbitrary "intentional move" threshold)
                if (dx > 20 || dy > 20) {
                    this.isClickZoomed = false
                }
            }
        }

        // MOVEMENT CHECK: Only move camera if moved significantly (Deadzone)
        // Calculate distance from current target
        const distDx = scaledX - this.target.x
        const distDy = scaledY - this.target.y
        const dist = Math.sqrt(distDx * distDx + distDy * distDy)

        if (dist > this.deadZone) {
            // If we are moving outside deadzone, we should be zoomed in
            if (!this.isZoomedIn) {
                this.isZoomedIn = true
                // [MODIFIED] REMOVED SNAPPING logic to prevent jumping
                // We just start updating the target smoothly from wherever it was
                this.target.x = scaledX
                this.target.y = scaledY
            } else {
                // Smoothly update target
                this.target.x = scaledX
                this.target.y = scaledY
            }
        }
    }

    private loop = () => {
        if (!this.video || this.video.ended) {
            return
        }

        const now = Date.now()
        const timeSinceActive = now - this.lastActiveTime

        // Auto-zoom logic
        if (timeSinceActive > this.idleThreshold) {
            this.target.zoom = this.zoomIdleLevel
            this.isZoomedIn = false
            this.isClickZoomed = false // Reset click zoom on idle

            // When zooming out, recenter to the center of the screen
            this.target.x = this.canvas.width / 2
            this.target.y = this.canvas.height / 2
        } else {
            // [MODIFIED] Choose zoom level based on state
            if (this.isClickZoomed) {
                this.target.zoom = this.clickZoomLevel
            } else {
                this.target.zoom = this.zoomActiveLevel
            }
        }

        // Smooth camera movement (lerp)
        // [MODIFIED] Dynamic smoothing for "Cinematic Zoom In"
        let posSmoothFactor = 0.04
        let zoomSmoothFactor = 0.04

        if (this.target.zoom > this.camera.zoom) {
            // Zooming In: "Precise Lock-on" effect
            // High pan speed to snap to target, moderate zoom speed
            zoomSmoothFactor = 0.04
            posSmoothFactor = 0.2 // Very fast pan to "lock on"
        } else {
            // Zooming Out: Synchronized (Perfect as is)
            zoomSmoothFactor = 0.04
            posSmoothFactor = 0.04
        }

        this.camera.zoom += (this.target.zoom - this.camera.zoom) * zoomSmoothFactor

        // Clamp target position to keep viewport within video bounds
        // Viewport dimensions in world space
        const viewportW = this.canvas.width / this.camera.zoom
        const viewportH = this.canvas.height / this.camera.zoom

        // Min/Max camera positions (center of viewport)
        const minX = viewportW / 2
        const maxX = this.canvas.width - viewportW / 2
        const minY = viewportH / 2
        const maxY = this.canvas.height - viewportH / 2

        // Clamp target before lerping (or clamp camera after lerping? Clamping target is safer for smooth approach)
        // Actually, we should clamp the *target* so the camera smoothly approaches the edge but stops.
        const clampedTargetX = Math.max(minX, Math.min(maxX, this.target.x))
        const clampedTargetY = Math.max(minY, Math.min(maxY, this.target.y))

        this.camera.x += (clampedTargetX - this.camera.x) * posSmoothFactor
        this.camera.y += (clampedTargetY - this.camera.y) * posSmoothFactor

        // [NEW] Hard clamp camera to prevent black bars
        // This is necessary because "Slow Pan" might leave the camera outside the "Fast Zoom" viewport
        this.camera.x = Math.max(minX, Math.min(maxX, this.camera.x))
        this.camera.y = Math.max(minY, Math.min(maxY, this.camera.y))

        // Clear canvas
        this.ctx.fillStyle = '#000'
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

        // Draw video with camera transform
        this.ctx.save()

        // Translate to center
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2)

        // Apply zoom
        this.ctx.scale(this.camera.zoom, this.camera.zoom)

        // Translate to camera position (inverted because we're moving the world)
        this.ctx.translate(-this.camera.x, -this.camera.y)

        // Draw the video only if it has data
        if (this.video.readyState >= 2) {
            this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height)
        }

        this.ctx.restore()
    }

    startLoop() {
        if (this.rafId) return
        // Use setInterval instead of requestAnimationFrame to run in background
        this.rafId = window.setInterval(this.loop, 1000 / 60)
    }

    stopLoop() {
        if (this.rafId) {
            window.clearInterval(this.rafId)
            this.rafId = null
        }
    }

    getStream(): MediaStream {
        // Capture at 60fps
        return this.canvas.captureStream(60)
    }

    getCanvas(): HTMLCanvasElement {
        return this.canvas
    }
}
