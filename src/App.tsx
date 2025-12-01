import { useEffect, useRef, useState } from 'react'
import { useAppStore } from './store/useAppStore'
import { Composer } from './engine/Composer'
import { Recorder } from './engine/Recorder'
import { Button, Card, Space, ConfigProvider, theme, Typography } from 'antd'
import { PlayCircleOutlined, PauseCircleFilled, CaretRightFilled, StopFilled, MonitorOutlined, AppstoreOutlined, SettingOutlined, ArrowLeftOutlined, CloseOutlined } from '@ant-design/icons'
import { motion, AnimatePresence } from 'framer-motion'
import { VideoEditor } from './components/VideoEditor'
import logo from './assets/logo.png'

const { Title, Text } = Typography

interface Source {
  id: string
  name: string
  thumbnail: string
  appIcon?: string
  type: 'screen' | 'window'
}

type ViewState = 'home' | 'source-selector' | 'recording' | 'editor'

function App() {
  const { isRecording, isPaused, setIsRecording, setIsPaused } = useAppStore()
  const [view, setView] = useState<ViewState>('home')
  const [sources, setSources] = useState<Source[]>([])
  const [countdown, setCountdown] = useState<number | null>(null)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)

  const composerRef = useRef<Composer>(new Composer())
  const recorderRef = useRef<Recorder>(new Recorder())
  const streamRef = useRef<MediaStream | null>(null)


  // ... (Mouse tracking and Tray Listeners remain same)
  // Mouse tracking
  useEffect(() => {
    if (!window.ipcRenderer) return

    const handleMouse = (_: any, point: { x: number, y: number }) => {
      composerRef.current.updateMousePosition(point.x, point.y)
    }

    const handleClick = () => {
      composerRef.current.handleClick()
    }

    const handleKey = () => {
      composerRef.current.handleKey()
    }

    const removeListener = window.ipcRenderer.on('mouse-position', handleMouse)
    const removeClickListener = window.ipcRenderer.on('mouse-click', handleClick)
    const removeKeyListener = window.ipcRenderer.on('keyboard-event', handleKey)

    return () => {
      removeListener()
      removeClickListener()
      removeKeyListener()
    }
  }, [])

  // Tray Listeners & State Sync
  useEffect(() => {
    if (!window.ipcRenderer) return

    // Sync state to main process for tray menu updates
    window.ipcRenderer.send('recording-state-changed', { isRecording, isPaused })

    const handleTrayPause = () => togglePause()
    const handleTrayStop = () => stopRecording()

    const removePauseListener = window.ipcRenderer.on('tray-pause', handleTrayPause)
    const removeStopListener = window.ipcRenderer.on('tray-stop', handleTrayStop)

    return () => {
      removePauseListener()
      removeStopListener()
    }
  }, [isRecording, isPaused])

  // Connect preview video when recording starts


  const fetchSources = async () => {
    try {
      if (window.ipcRenderer) {
        const sourcesData = await window.ipcRenderer.invoke('get-sources')
        setSources(sourcesData.map((s: any) => ({
          ...s,
          type: s.id.startsWith('screen:') ? 'screen' : 'window'
        })))
      }
    } catch (err) {
      console.error('Failed to fetch sources:', err)
    }
  }

  const handleStartClick = async () => {
    await fetchSources()
    setView('source-selector')
  }

  const startRecordingWithSource = async (sourceId: string) => {
    // Start countdown
    for (let i = 3; i > 0; i--) {
      setCountdown(i)
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    setCountdown(null)
    setView('recording')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: sourceId,
            minWidth: 1920,
            maxWidth: 3840,
            minHeight: 1080,
            maxHeight: 2160,
            minFrameRate: 60,
            maxFrameRate: 60
          }
        } as any
      })

      streamRef.current = stream
      stream.getVideoTracks()[0].onended = () => stopRecording()

      await composerRef.current.start(stream)
      const composedStream = composerRef.current.getStream()
      recorderRef.current.start(composedStream)

      setIsRecording(true)
    } catch (err) {
      console.error('Failed to start recording:', err)
      setView('home')
    }
  }

  const stopRecording = async () => {
    try {
      const blob = await recorderRef.current.stop()
      composerRef.current.stop()

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }

      setIsRecording(false)
      setIsPaused(false)

      // Instead of saving, go to editor
      setRecordedBlob(blob)
      setView('editor')

    } catch (err) {
      console.error('Failed to stop recording:', err)
    }
  }

  const handleEditorSave = async (processedBlob: Blob) => {
    try {
      if (window.ipcRenderer) {
        const buffer = await processedBlob.arrayBuffer()
        await window.ipcRenderer.invoke('save-video', buffer)
      } else {
        const url = URL.createObjectURL(processedBlob)
        const a = document.createElement('a')
        a.href = url
        a.download = `recording-${Date.now()}.mp4`
        a.click()
        URL.revokeObjectURL(url)
      }
      setView('home')
      setRecordedBlob(null)
    } catch (err) {
      console.error('Failed to save processed video:', err)
    }
  }

  const togglePause = () => {
    if (isPaused) {
      recorderRef.current.resume()
      setIsPaused(false)
    } else {
      recorderRef.current.pause()
      setIsPaused(true)
    }
  }

  const handleClose = () => {
    window.close()
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorBgBase: '#000000',
          colorTextBase: '#ffffff',
          fontSize: 14,
          borderRadius: 4,
        }
      }}
    >
      <div style={{ width: '100vw', height: '100vh', background: '#000', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        {/* Drag Region */}
        <div className="drag-region" style={{ height: 40, width: '100%', zIndex: 1000, position: 'absolute', top: 0, left: 0, display: 'flex', justifyContent: 'flex-end', padding: '8px 16px' }}>
          <Button
            type="text"
            icon={<CloseOutlined style={{ fontSize: 16 }} />}
            onClick={handleClose}
            className="no-drag"
            style={{ color: '#fff', opacity: 0.7 }}
          />
        </div>

        {/* Countdown Overlay */}
        <AnimatePresence>
          {countdown !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 2000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#000'
              }}
            >
              <div style={{ fontSize: 200, fontWeight: 'bold', color: '#fff', fontFamily: 'monospace' }}>
                {countdown}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* VIEW: HOME or RECORDING */}
        {(view === 'home' || view === 'recording') && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', maxWidth: 600, width: '100%', padding: 32 }}>
              <img src={logo} alt="Logo" style={{ width: 80, height: 80, marginBottom: 24 }} />
              <Title level={1} style={{ fontSize: 48, marginBottom: 8, letterSpacing: -1 }}>The Recorder Project</Title>
              <Text type="secondary" style={{ fontSize: 18, display: 'block', marginBottom: 48 }}>
                Every Recording turns into your product launch
              </Text>

              {!isRecording ? (
                <Button
                  type="primary"
                  size="large"
                  icon={<PlayCircleOutlined />}
                  onClick={handleStartClick}
                  style={{ width: '100%', height: 56, fontSize: 18, fontWeight: 500 }}
                >
                  Start Recording
                </Button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 16,
                    padding: '24px 32px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 32
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: isPaused ? '#faad14' : '#f5222d',
                        boxShadow: isPaused ? '0 0 10px rgba(250, 173, 20, 0.5)' : '0 0 10px rgba(245, 34, 45, 0.5)'
                      }} />
                      <Text strong style={{ fontFamily: 'monospace', fontSize: 16 }}>
                        {isPaused ? 'PAUSED' : 'RECORDING'}
                      </Text>
                    </div>

                    <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.1)' }} />

                    <Space size="large">
                      <Button
                        type="default"
                        size="large"
                        icon={isPaused ? <CaretRightFilled /> : <PauseCircleFilled />}
                        onClick={togglePause}
                        style={{ height: 48, padding: '0 24px' }}
                      >
                        {isPaused ? 'Resume' : 'Pause'}
                      </Button>

                      <Button
                        type="primary"
                        danger
                        size="large"
                        icon={<StopFilled />}
                        onClick={stopRecording}
                        style={{ height: 48, padding: '0 24px' }}
                      >
                        Stop
                      </Button>
                    </Space>
                  </div>
                </div>
              )}

              <div style={{ marginTop: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32 }}>
                <Space>
                  <MonitorOutlined style={{ fontSize: 16 }} />
                  <Text strong style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>4K 60FPS</Text>
                </Space>
                <div style={{ width: 1, height: 16, background: '#333' }} />
                <Space>
                  <SettingOutlined style={{ fontSize: 16 }} />
                  <Text strong style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>Auto-Zoom</Text>
                </Space>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: SOURCE SELECTOR (Full Screen) */}
        {view === 'source-selector' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '60px 40px', overflowY: 'auto' }}>
            <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', gap: 16 }}>
              <Button icon={<ArrowLeftOutlined />} onClick={() => setView('home')} type="text" />
              <div>
                <Title level={2} style={{ margin: 0 }}>Select Source</Title>
                <Text type="secondary">Choose what you want to capture</Text>
              </div>
            </div>

            <Space direction="vertical" size={40} style={{ width: '100%' }}>
              {/* Screens */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <MonitorOutlined />
                  <Text strong style={{ fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Screens</Text>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
                  {sources.filter(s => s.type === 'screen').map((source) => (
                    <Card
                      key={source.id}
                      hoverable
                      onClick={() => startRecordingWithSource(source.id)}
                      cover={<img alt={source.name} src={source.thumbnail} style={{ height: 180, objectFit: 'cover' }} />}
                      bodyStyle={{ padding: 16 }}
                      style={{ border: '1px solid #333' }}
                    >
                      <Card.Meta title={source.name} />
                    </Card>
                  ))}
                </div>
              </div>

              {/* Windows */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <AppstoreOutlined />
                  <Text strong style={{ fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Windows</Text>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 24 }}>
                  {sources.filter(s => s.type === 'window').map((source) => (
                    <Card
                      key={source.id}
                      hoverable
                      onClick={() => startRecordingWithSource(source.id)}
                      cover={<img alt={source.name} src={source.thumbnail} style={{ height: 135, objectFit: 'cover' }} />}
                      bodyStyle={{ padding: 12 }}
                      style={{ border: '1px solid #333' }}
                    >
                      <Space>
                        {source.appIcon && <img src={source.appIcon} style={{ width: 20, height: 20, borderRadius: 4 }} />}
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{source.name}</span>
                      </Space>
                    </Card>
                  ))}
                </div>
              </div>
            </Space>
          </div>
        )}

        {/* VIEW: EDITOR */}
        {view === 'editor' && recordedBlob && (
          <VideoEditor
            videoBlob={recordedBlob}
            onSave={handleEditorSave}
            onCancel={() => {
              setView('home')
              setRecordedBlob(null)
            }}
          />
        )}
      </div>
    </ConfigProvider>
  )
}

export default App
