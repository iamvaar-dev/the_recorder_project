import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Mic, Play, Pause, Settings, Square, Zap } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { SourceSelector } from './SourceSelector'

export const ControlBar: React.FC = () => {
    const { isRecording, isPaused, setIsRecording, setIsPaused } = useAppStore()
    const [isSourceSelectorOpen, setIsSourceSelectorOpen] = useState(false)

    const handleStop = () => {
        setIsRecording(false)
        setIsPaused(false)
    }

    return (
        <>
            <SourceSelector isOpen={isSourceSelectorOpen} onClose={() => setIsSourceSelectorOpen(false)} />

            <motion.div
                className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#050505]/80 backdrop-blur-2xl border border-white/10 rounded-full px-2 py-2 flex items-center gap-2 shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)] z-50"
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
            >
                {/* Status Indicator */}
                <div className="flex items-center gap-3 pl-4 pr-2">
                    <div className="relative">
                        <div className={`w-2.5 h-2.5 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-red-500'}`} />
                        {!isPaused && <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" />}
                    </div>
                    <span className="text-xs font-mono font-medium text-white/80 tracking-wider">
                        {isPaused ? 'PAUSED' : 'REC'}
                    </span>
                </div>

                <div className="w-px h-6 bg-white/10 mx-1" />

                {/* Controls Group */}
                <div className="flex items-center gap-1">
                    {/* Pause/Resume */}
                    <button
                        onClick={() => setIsPaused(!isPaused)}
                        className="p-3 rounded-full hover:bg-white/10 transition-colors text-white/80 hover:text-white group"
                        title={isPaused ? "Resume" : "Pause"}
                    >
                        {isPaused ? <Play size={18} className="fill-current" /> : <Pause size={18} className="fill-current" />}
                    </button>

                    {/* Stop Button */}
                    <button
                        onClick={handleStop}
                        className="group flex items-center justify-center w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 transition-all active:scale-95 shadow-lg shadow-red-500/20"
                        title="Stop Recording"
                    >
                        <Square size={16} className="text-white fill-current" />
                    </button>
                </div>

                <div className="w-px h-6 bg-white/10 mx-1" />

                {/* Tools Group */}
                <div className="flex items-center gap-1 pr-2">
                    <button className="p-3 rounded-full hover:bg-white/10 transition-colors text-white/80 hover:text-white">
                        <Mic size={18} />
                    </button>
                    <button className="p-3 rounded-full hover:bg-white/10 transition-colors text-white/80 hover:text-white">
                        <Settings size={18} />
                    </button>
                </div>
            </motion.div>
        </>
    )
}
