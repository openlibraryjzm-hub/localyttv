import React, { useState, useRef, useEffect } from 'react';
import { X, Scissors, Check } from 'lucide-react';

export default function TileExtractorModal({
    isOpen,
    onClose,
    image,
    scale = 100,
    onExtract
}) {
    const [selectedTile, setSelectedTile] = useState(0);
    const canvasRef = useRef(null);
    const [extractedImage, setExtractedImage] = useState(null);

    // Extract the selected tile when tile selection changes
    useEffect(() => {
        if (!image || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const img = new Image();
        img.onload = () => {
            // Calculate tile dimensions
            // Assuming 1920px reference width for 100% scale
            const REFERENCE_WIDTH = 1920;
            const tileWidth = (scale / 100) * REFERENCE_WIDTH;
            const tileHeight = tileWidth * (img.naturalHeight / img.naturalWidth);

            // Set canvas to tile size
            canvas.width = tileWidth;
            canvas.height = tileHeight;

            // Draw the selected tile
            // Offset by -selectedTile * tileWidth to show that specific tile
            ctx.drawImage(
                img,
                0, 0, // Source position (always start from 0,0 of source image)
                img.naturalWidth, img.naturalHeight, // Source dimensions (full image)
                -selectedTile * tileWidth, 0, // Destination position (shift left by tile count)
                tileWidth, tileHeight // Destination dimensions
            );

            // Convert to data URL
            const dataUrl = canvas.toDataURL('image/png');
            setExtractedImage(dataUrl);
        };
        img.src = image;
    }, [image, selectedTile, scale]);

    const handleExtract = () => {
        if (extractedImage && onExtract) {
            onExtract(extractedImage);
            onClose();
        }
    };

    if (!isOpen || !image) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 animate-in fade-in duration-300">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-start z-50 pointer-events-none">
                <div className="space-y-1">
                    <h2 className="text-4xl font-black uppercase text-white tracking-widest drop-shadow-2xl flex items-center gap-4">
                        <Scissors className="text-sky-500 hidden sm:block" size={42} />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                            Extract Single Tile
                        </span>
                    </h2>
                    <p className="text-sky-400/80 text-sm font-bold tracking-wider uppercase ml-1 sm:ml-[60px]">
                        Select a tile to use as your banner
                    </p>
                </div>

                <button
                    onClick={onClose}
                    className="p-4 rounded-full bg-white/5 hover:bg-white/20 text-white/70 hover:text-white transition-all backdrop-blur-md border border-white/10 group pointer-events-auto"
                >
                    <X size={32} className="group-hover:scale-110 transition-transform duration-300" />
                </button>
            </div>

            {/* Main Content */}
            <div className="relative w-full h-full flex flex-col items-center justify-center p-24 gap-8">

                {/* Preview Area */}
                <div className="relative bg-slate-900/50 border-2 border-sky-500/30 rounded-2xl p-8 shadow-2xl backdrop-blur-md">
                    <div className="text-center mb-4">
                        <p className="text-white font-bold text-lg">Preview: Tile {selectedTile + 1}</p>
                        <p className="text-slate-400 text-sm">This is what will become your banner</p>
                    </div>

                    {/* Preview Image */}
                    <div className="relative bg-black/50 rounded-lg overflow-hidden border border-white/10" style={{ width: '800px', height: '200px' }}>
                        {extractedImage && (
                            <img
                                src={extractedImage}
                                alt="Extracted tile preview"
                                className="w-full h-full object-cover"
                            />
                        )}
                    </div>
                </div>

                {/* Tile Selector */}
                <div className="bg-slate-900/80 backdrop-blur-md border border-white/20 rounded-xl p-6 shadow-2xl w-full max-w-2xl">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="text-white font-bold uppercase tracking-wider">Select Tile</label>
                            <span className="text-sky-400 font-mono text-lg">Tile {selectedTile + 1} of 11</span>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="text-slate-400 text-sm font-bold">1</span>
                            <input
                                type="range"
                                min="0"
                                max="10"
                                step="1"
                                value={selectedTile}
                                onChange={(e) => setSelectedTile(parseInt(e.target.value))}
                                className="flex-1 h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                            />
                            <span className="text-slate-400 text-sm font-bold">11</span>
                        </div>

                        <p className="text-slate-400 text-xs text-center">
                            Slide to preview different tiles from your repeating banner pattern
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                    <button
                        onClick={onClose}
                        className="px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold uppercase tracking-wider transition-all shadow-lg"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleExtract}
                        className="px-8 py-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white rounded-xl font-bold uppercase tracking-wider transition-all shadow-lg flex items-center gap-3"
                    >
                        <Check size={20} />
                        Use This Tile
                    </button>
                </div>

                {/* Hidden canvas for extraction */}
                <canvas ref={canvasRef} className="hidden" />
            </div>
        </div>
    );
}
