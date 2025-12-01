export class Recorder {
    private mediaRecorder: MediaRecorder | null = null
    private chunks: Blob[] = []
    private selectedMimeType: string = ''

    start(stream: MediaStream) {
        this.chunks = []

        // Prioritize MP4/H.264 for compatibility, then WebM/VP9 for quality
        const mimeTypes = [
            'video/mp4',
            'video/webm;codecs=h264',
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm'
        ]

        let selectedMimeType = ''
        for (const type of mimeTypes) {
            if (MediaRecorder.isTypeSupported(type)) {
                selectedMimeType = type
                break
            }
        }

        this.selectedMimeType = selectedMimeType || 'video/webm'

        const options: MediaRecorderOptions = {
            mimeType: this.selectedMimeType || undefined,
            videoBitsPerSecond: 15000000, // 15 Mbps for high quality
        }

        console.log('Recording with options:', options)

        try {
            this.mediaRecorder = new MediaRecorder(stream, options)
        } catch (e) {
            console.error('Failed to create MediaRecorder with options:', options, e)
            // Fallback to default
            this.mediaRecorder = new MediaRecorder(stream)
        }

        this.mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                this.chunks.push(e.data)
            }
        }

        // Request data every 1000ms (1s) to avoid too many small chunks, 
        // but frequent enough to save if it crashes.
        this.mediaRecorder.start(1000)
    }

    pause() {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.pause()
        }
    }

    resume() {
        if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
            this.mediaRecorder.resume()
        }
    }

    async stop(): Promise<Blob> {
        return new Promise((resolve) => {
            if (!this.mediaRecorder) return resolve(new Blob([]))

            this.mediaRecorder.onstop = () => {
                const blob = new Blob(this.chunks, { type: this.selectedMimeType })
                resolve(blob)
            }

            this.mediaRecorder.stop()
        })
    }
}
