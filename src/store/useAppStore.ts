import { create } from 'zustand'

interface AppState {
    isRecording: boolean
    isPaused: boolean
    selectedSourceId: string | null
    recordingMode: 'fullscreen' | 'window' | 'region'
    setIsRecording: (isRecording: boolean) => void
    setIsPaused: (isPaused: boolean) => void
    setSelectedSourceId: (sourceId: string | null) => void
    setRecordingMode: (mode: 'fullscreen' | 'window' | 'region') => void
}

export const useAppStore = create<AppState>((set) => ({
    isRecording: false,
    isPaused: false,
    selectedSourceId: null,
    recordingMode: 'fullscreen',
    setIsRecording: (isRecording) => set({ isRecording }),
    setIsPaused: (isPaused) => set({ isPaused }),
    setSelectedSourceId: (selectedSourceId) => set({ selectedSourceId }),
    setRecordingMode: (recordingMode) => set({ recordingMode }),
}))
