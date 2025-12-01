import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Monitor, AppWindow, AlertCircle, Layers } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'

interface Source {
    id: string
    name: string
    thumbnail: string // Data URL
    appIcon?: string // Data URL
}

interface SourceSelectorProps {
    isOpen: boolean
    onClose: () => void
}

export const SourceSelector: React.FC<SourceSelectorProps> = ({ isOpen, onClose }) => {
    const [sources, setSources] = useState<Source[]>([])
    const { setSelectedSourceId, setIsRecording } = useAppStore()
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'screens' | 'windows'>('screens')

    useEffect(() => {
        if (isOpen) {
            const fetchSources = async () => {
                setError(null)
                try {
                    if (window.ipcRenderer) {
                        const sources = await window.ipcRenderer.invoke('get-sources')
                        setSources(sources)
                    } else {
                        // Browser fallback
                        setSources([])
                    }
                } catch (e) {
                    console.error("Failed to fetch sources:", e)
                    setError("Failed to load sources. Please use the system picker.")
                }
            }
            fetchSources()
        }
    }, [isOpen])

    const handleSystemPicker = () => {
        setSelectedSourceId('system-picker')
        setIsRecording(true) // Auto-start for smoother flow
        onClose()
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-xl p-8"
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="w-full max-w-6xl h-[80vh] flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-3xl font-bold text-white mb-2">Select Source</h2>
                                <p className="text-white/40">Choose what you want to capture</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-white/60 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex items-center gap-4 mb-8 border-b border-white/5 pb-1">
                            <button
                                onClick={() => setActiveTab('screens')}
                                className={`pb-4 px-2 text-sm font-medium transition-all relative ${activeTab === 'screens' ? 'text-cyan-400' : 'text-white/40 hover:text-white'}`}
                            >
                                Screens
                                {activeTab === 'screens' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-400" />}
                            </button>
                            <button
                                onClick={() => setActiveTab('windows')}
                                className={`pb-4 px-2 text-sm font-medium transition-all relative ${activeTab === 'windows' ? 'text-cyan-400' : 'text-white/40 hover:text-white'}`}
                            >
                                Windows
                                {activeTab === 'windows' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-400" />}
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto pr-2">
                            {/* System Picker Card (Hero) */}
                            <div className="mb-10">
                                <button
                                    onClick={handleSystemPicker}
                                    className="w-full group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-cyan-500/20 hover:border-cyan-500/50 transition-all p-8 text-left"
                                >
                                    <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="flex items-start justify-between relative z-10">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-transform duration-500">
                                                <Layers size={32} className="text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">System Picker (Recommended)</h3>
                                                <p className="text-white/60 max-w-md">Use the native macOS picker to select any screen, window, or application with full system permissions.</p>
                                            </div>
                                        </div>
                                        <div className="px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium">
                                            Best Quality
                                        </div>
                                    </div>
                                </button>
                            </div>

                            {error && (
                                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 flex items-center gap-3 mb-6">
                                    <AlertCircle size={20} />
                                    {error}
                                </div>
                            )}

                            {/* Grid */}
                            {sources.length > 0 && (
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                                    {sources.map((source) => (
                                        <button
                                            key={source.id}
                                            onClick={() => {
                                                setSelectedSourceId(source.id)
                                                setIsRecording(true)
                                                onClose()
                                            }}
                                            className="group relative aspect-video bg-white/5 rounded-xl border border-white/10 overflow-hidden hover:border-cyan-500/50 transition-all text-left"
                                        >
                                            <img src={source.thumbnail} alt={source.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500" />

                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                                            <div className="absolute bottom-0 left-0 right-0 p-4">
                                                <div className="flex items-center gap-3 mb-2">
                                                    {source.appIcon && <img src={source.appIcon} className="w-6 h-6 rounded-md" />}
                                                    <span className="font-medium text-white truncate">{source.name}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-white/40 bg-white/10 px-1.5 py-0.5 rounded">1920x1080</span>
                                                </div>
                                            </div>

                                            {/* Hover Overlay */}
                                            <div className="absolute inset-0 border-2 border-cyan-500/0 group-hover:border-cyan-500/50 rounded-xl transition-all duration-300" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

