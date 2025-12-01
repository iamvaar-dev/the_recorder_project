import { useState, useRef, useEffect } from 'react'
import { Button, Space, Typography, Spin, message } from 'antd'
import { ScissorOutlined, ExpandOutlined, EyeInvisibleOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons'
import { Range } from 'react-range'

const { Title, Text } = Typography

interface VideoEditorProps {
    videoBlob: Blob
    onSave: (processedBlob: Blob) => void
    onCancel: () => void
}

export function VideoEditor({ videoBlob, onSave, onCancel }: VideoEditorProps) {
    const videoUrl = useRef(URL.createObjectURL(videoBlob)).current
    const videoRef = useRef<HTMLVideoElement>(null)
    const [duration, setDuration] = useState(0)
    const [trimRange, setTrimRange] = useState([0, 100]) // Percentage
    const [isCropped, setIsCropped] = useState(false)
    const [isBlurred, setIsBlurred] = useState(false)
    const [processing, setProcessing] = useState(false)

    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        const handleLoadedMetadata = () => {
            setDuration(video.duration)
        }

        video.addEventListener('loadedmetadata', handleLoadedMetadata)
        return () => video.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }, [])

    const handleExport = async () => {
        setProcessing(true)
        try {
            const buffer = await videoBlob.arrayBuffer()

            const startTime = (trimRange[0] / 100) * duration
            const endTime = (trimRange[1] / 100) * duration

            const options: any = {
                trim: { start: startTime, end: endTime }
            }

            if (isCropped) {
                // Simple center crop for demo: Keep center 70%
                // In a real app, we'd calculate this based on video dimensions
                // Assuming 1920x1080 for calculation logic, but ffmpeg handles relative?
                // We'll pass generic params and let main process handle or just hardcode a "Cinematic Crop"
                // Let's assume we crop to 1920x800 (Cinematic bars removal or similar)
                // For this demo, let's do a square crop center
                options.crop = { w: 1080, h: 1080, x: '(in_w-1080)/2', y: '(in_h-1080)/2' }
            }

            if (isBlurred) {
                options.blur = true
            }

            if (window.ipcRenderer) {
                const processedBuffer = await window.ipcRenderer.invoke('process-video', { buffer, options })
                const processedBlob = new Blob([processedBuffer], { type: 'video/mp4' })
                onSave(processedBlob)
            } else {
                // Fallback for web (no ffmpeg)
                onSave(videoBlob)
            }
        } catch (err) {
            console.error('Export failed:', err)
            message.error('Failed to process video')
            setProcessing(false)
        }
    }

    return (
        <div style={{
            position: 'absolute',
            inset: 0,
            background: '#000',
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column',
            padding: 40
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title level={2} style={{ margin: 0 }}>Edit Recording</Title>
                <Button
                    danger
                    type="text"
                    icon={<CloseOutlined />}
                    onClick={() => {
                        if (confirm('Are you sure you want to discard this recording?')) {
                            onCancel()
                        }
                    }}
                >
                    Discard
                </Button>
            </div>

            <div style={{ flex: 1, position: 'relative', background: '#111', borderRadius: 12, overflow: 'hidden', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <video
                    ref={videoRef}
                    src={videoUrl}
                    controls
                    style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        filter: isBlurred ? 'blur(10px)' : 'none', // Preview blur
                        objectFit: isCropped ? 'cover' : 'contain' // Preview crop (fake)
                    }}
                />
            </div>

            <div style={{ background: '#111', padding: 24, borderRadius: 12 }}>
                <Space direction="vertical" style={{ width: '100%' }} size="large">

                    {/* Trim Slider */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <Text strong><ScissorOutlined /> Trim</Text>
                            <Text type="secondary">
                                {((trimRange[0] / 100) * duration).toFixed(1)}s - {((trimRange[1] / 100) * duration).toFixed(1)}s
                            </Text>
                        </div>
                        <Range
                            step={0.1}
                            min={0}
                            max={100}
                            values={trimRange}
                            onChange={(values) => setTrimRange(values)}
                            renderTrack={({ props, children }) => (
                                <div
                                    {...props}
                                    style={{
                                        ...props.style,
                                        height: '6px',
                                        width: '100%',
                                        backgroundColor: '#333',
                                        borderRadius: '3px'
                                    }}
                                >
                                    {children}
                                </div>
                            )}
                            renderThumb={({ props }) => (
                                <div
                                    {...props}
                                    style={{
                                        ...props.style,
                                        height: '20px',
                                        width: '20px',
                                        borderRadius: '50%',
                                        backgroundColor: '#1890ff',
                                        border: '2px solid #000'
                                    }}
                                />
                            )}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Space size="large">
                            <Button
                                type={isCropped ? 'primary' : 'default'}
                                icon={<ExpandOutlined />}
                                onClick={() => setIsCropped(!isCropped)}
                            >
                                Crop Center
                            </Button>
                            <Button
                                type={isBlurred ? 'primary' : 'default'}
                                icon={<EyeInvisibleOutlined />}
                                onClick={() => setIsBlurred(!isBlurred)}
                            >
                                Blur
                            </Button>
                        </Space>

                        <Button
                            type="primary"
                            size="large"
                            icon={processing ? <Spin /> : <SaveOutlined />}
                            onClick={handleExport}
                            disabled={processing}
                        >
                            {processing ? 'Processing...' : 'Export Video'}
                        </Button>
                    </div>
                </Space>
            </div>
        </div>
    )
}
