import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfigStore } from '../store/configStore';

const StartScreen = ({ onStart }) => {
    const { fullscreenBanner } = useConfigStore();
    const [isHovered, setIsHovered] = useState(false);

    // Use app banner as background if available, otherwise a cool gradient
    const bgImage = fullscreenBanner?.image;

    // Handle key press to start
    useEffect(() => {
        const handleKeyPress = (e) => {
            onStart();
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [onStart]);

    return (
        <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-black text-white select-none"
            onClick={onStart}
        >
            {/* Background Layer */}
            <div className="absolute inset-0 z-0">
                {bgImage ? (
                    <div
                        className="w-full h-full bg-cover bg-center opacity-40 blur-sm scale-105"
                        style={{ backgroundImage: `url(${bgImage})` }}
                    />
                ) : (
                    <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900 via-slate-900 to-black opacity-80" />
                )}
                <div className="absolute inset-0 bg-black/30" /> {/* Dimming overlay */}
            </div>

            {/* Content Layer */}
            <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-8">

                {/* Logo / Title Area */}
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 1, delay: 0.2, type: "spring" }}
                    className="mb-16 text-center"
                >
                    <h1 className="text-8xl md:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-blue-200 to-slate-400 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                        ATLAS
                    </h1>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 1.5, delay: 0.8 }}
                        className="h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent w-full mt-4"
                    />
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.5, duration: 1 }}
                        className="mt-4 text-xl md:text-2xl text-blue-200/70 font-light tracking-[0.5em] uppercase"
                    >
                        Media Manager
                    </motion.p>
                </motion.div>

                {/* Press Start Prompt */}
                <motion.div
                    animate={{
                        opacity: [1, 0.4, 1],
                        scale: isHovered ? 1.05 : 1
                    }}
                    transition={{
                        opacity: { repeat: Infinity, duration: 2, ease: "easeInOut" },
                        scale: { duration: 0.2 }
                    }}
                    className="mt-12 cursor-pointer group"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    <div className="relative px-8 py-4 overflow-hidden rounded-full border border-white/10 group-hover:border-blue-400/50 transition-colors duration-300">
                        {/* Hover shine effect */}
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />

                        <span className="relative text-2xl md:text-3xl font-bold tracking-widest uppercase text-white/90 group-hover:text-blue-100 transition-colors">
                            Press Start
                        </span>
                    </div>
                </motion.div>

                {/* Footer Info */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2, duration: 1 }}
                    className="absolute bottom-8 text-xs text-white/30 font-mono tracking-wider flex items-center gap-4"
                >
                    <span>v2.0.0</span>
                    <span>•</span>
                    <span>© 2026 YTTV INC</span>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default StartScreen;
