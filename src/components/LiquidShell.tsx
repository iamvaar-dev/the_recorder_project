import React from 'react'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'

interface LiquidShellProps {
    children: React.ReactNode
    className?: string
}

export const LiquidShell: React.FC<LiquidShellProps> = ({ children, className }) => {
    return (
        <div className={clsx("relative w-screen h-screen overflow-hidden flex items-center justify-center", className)}>
            {/* Drag Region */}
            <div className="absolute top-0 left-0 w-full h-8 z-50 app-drag-region" style={{ WebkitAppRegion: 'drag' } as any} />

            {/* Content */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative z-10 w-full h-full flex flex-col"
            >
                {children}
            </motion.div>
        </div>
    )
}
