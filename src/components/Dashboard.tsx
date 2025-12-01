import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Video, Settings, Clock, Home, Film, ChevronRight, Zap } from 'lucide-react'

import { SourceSelector } from './SourceSelector'

export const Dashboard: React.FC = () => {
    const [isSourceSelectorOpen, setIsSourceSelectorOpen] = useState(false)
    const [activeTab, setActiveTab] = useState('home')

    const sidebarItems = [
        { id: 'home', icon: Home, label: 'Home' },
        { id: 'library', icon: Film, label: 'Library' },
        { id: 'settings', icon: Settings, label: 'Settings' },
    ]

    return (
        <div className="w-full h-full bg-[#050505] text-white overflow-hidden flex font-sans selection:bg-cyan-500/30">
            <SourceSelector isOpen={isSourceSelectorOpen} onClose={() => setIsSourceSelectorOpen(false)} />

            {/* Sidebar */}
            <aside className="w-20 lg:w-64 border-r border-white/5 bg-white/[0.02] backdrop-blur-xl flex flex-col justify-between py-8">
                <div className="flex flex-col gap-8">
                    {/* Logo */}
                    <div className="px-6 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_20px_-5px_rgba(6,182,212,0.5)]">
                            <Zap size={20} className="text-white fill-current" />
                        </div>
                        <span className="hidden lg:block font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                            MAVA
                        </span>
                    </div>

                    {/* Nav */}
                    <nav className="px-4 space-y-2">
                        {sidebarItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group ${activeTab === item.id
                                    ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 text-cyan-400'
                                    : 'hover:bg-white/5 text-white/40 hover:text-white'
                                    }`}
                            >
                                <item.icon size={22} className={`transition-colors ${activeTab === item.id ? 'text-cyan-400' : 'group-hover:text-white'}`} />
                                <span className="hidden lg:block font-medium">{item.label}</span>
                                {activeTab === item.id && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute left-0 w-1 h-8 bg-cyan-500 rounded-r-full"
                                    />
                                )}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="px-6 hidden lg:block">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/5">
                        <div className="text-xs font-medium text-white/40 mb-2">STORAGE</div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-2">
                            <div className="w-[45%] h-full bg-gradient-to-r from-cyan-500 to-blue-500" />
                        </div>
                        <div className="text-xs text-white/60">45GB used of 100GB</div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto relative">
                {/* Background Gradients */}
                <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none" />
                <div className="absolute -top-20 -right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

                <div className="max-w-6xl mx-auto p-8 lg:p-12 space-y-12 relative z-10">
                    {/* Header */}
                    <header className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">Welcome back, Creator</h1>
                            <p className="text-white/40">Ready to capture your next product demo?</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 flex items-center gap-2 text-sm text-white/60">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                System Ready
                            </div>
                        </div>
                    </header>

                    {/* Hero Action */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative group cursor-pointer"
                        onClick={() => setIsSourceSelectorOpen(true)}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
                        <div className="relative h-64 rounded-3xl bg-[#0A0A0A] border border-white/10 overflow-hidden flex items-center justify-center group-hover:border-cyan-500/30 transition-all duration-500">
                            {/* Animated Grid Background */}
                            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '24px 24px' }} />

                            <div className="text-center space-y-6 relative z-10">
                                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_40px_-10px_rgba(6,182,212,0.6)] group-hover:scale-110 transition-transform duration-500">
                                    <Video size={32} className="text-white fill-white/20" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">Start Recording</h2>
                                    <p className="text-white/40">Capture full screen, window, or region</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Recent Section */}
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Clock size={18} className="text-cyan-500" />
                                Recent Captures
                            </h3>
                            <button className="text-sm text-white/40 hover:text-white transition-colors flex items-center gap-1 group">
                                View Library
                                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="group relative aspect-video bg-white/5 rounded-xl border border-white/5 overflow-hidden hover:border-cyan-500/30 transition-all cursor-pointer hover:-translate-y-1">
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />

                                    {/* Play Overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                                            <Video size={20} className="text-white ml-1" />
                                        </div>
                                    </div>

                                    <div className="absolute bottom-4 left-4 right-4">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors">Project Alpha {i}</span>
                                            <span className="text-[10px] font-mono bg-white/10 px-1.5 py-0.5 rounded text-white/60">4K</span>
                                        </div>
                                        <div className="text-xs text-white/40">2 hours ago • 142 MB</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    )
}
