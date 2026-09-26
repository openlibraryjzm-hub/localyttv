import React, { useMemo } from 'react';
import { useNavigationStore } from '../store/navigationStore';
import { ArrowLeft, ExternalLink } from 'lucide-react';

const TweetPage = () => {
    const { selectedTweet, setCurrentPage, goBack } = useNavigationStore();

    const tweet = selectedTweet;

    // If no tweet is selected, go back to videos (safety)
    if (!tweet) {
        React.useEffect(() => {
            setCurrentPage('videos');
        }, [setCurrentPage]);
        return null;
    }

    // Parse author
    const authorMatch = tweet.author?.match(/^(.+?)\s*\(@(.+?)\)$/);
    const displayName = authorMatch ? authorMatch[1] : (tweet.author || 'Twitter User');
    const handle = authorMatch ? `@${authorMatch[2]}` : '';

    // Get high-res image
    const highResImage = useMemo(() => {
        return tweet.thumbnail_url?.replace(/name=[a-z]+/, 'name=orig') || tweet.thumbnail_url;
    }, [tweet]);

    const handleBack = () => {
        goBack();
    };

    const handleOpenOriginal = () => {
        if (tweet.video_url) {
            window.open(tweet.video_url, '_blank');
        }
    };

    return (
        <div className="w-full h-full flex flex-col bg-transparent overflow-hidden">
            {/* Header / Toolbar */}
            <div className="flex items-center gap-4 px-6 py-4 backdrop-blur-md bg-white/5 border-b border-white/10 z-10 shrink-0">
                <button
                    onClick={handleBack}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/80 hover:text-white"
                    title="Go Back"
                >
                    <ArrowLeft size={24} />
                </button>
                <span className="text-xl font-bold text-white/90">Tweet Details</span>

                <div className="ml-auto">
                    <button
                        onClick={handleOpenOriginal}
                        className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg font-bold transition-colors shadow-lg"
                    >
                        <span>Open on X</span>
                        <ExternalLink size={16} />
                    </button>
                </div>
            </div>

            {/* Main Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="max-w-5xl mx-auto space-y-8">

                    {/* Author Card */}
                    <div className="flex items-center gap-4 p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                        <div className="flex-shrink-0">
                            {tweet.profile_image_url ? (
                                <img
                                    src={tweet.profile_image_url}
                                    className="w-16 h-16 rounded-full border-2 border-white/20 shadow-lg object-cover"
                                    alt={displayName}
                                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                />
                            ) : null}
                            <div
                                className="w-16 h-16 rounded-full bg-sky-500 flex items-center justify-center text-white text-2xl font-bold"
                                style={{ display: tweet.profile_image_url ? 'none' : 'flex' }}
                            >
                                {displayName.charAt(0).toUpperCase()}
                            </div>
                        </div>

                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl font-bold text-white mb-1 truncate">{displayName}</h1>
                            <p className="text-sky-400 font-medium text-lg">{handle}</p>
                        </div>
                    </div>

                    {/* Tweet Text */}
                    <div className="p-8 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm shadow-xl">
                        <p className="text-2xl leading-relaxed text-white/90 whitespace-pre-wrap font-medium">
                            {tweet.title || "No text content"}
                        </p>
                    </div>

                    {/* Media */}
                    {(tweet.video_url && tweet.video_url.includes('.mp4') || highResImage) && (
                        <div className="rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-black/20">
                            {tweet.video_url && tweet.video_url.includes('.mp4') ? (
                                <video
                                    src={tweet.video_url}
                                    className="w-full h-auto object-contain max-h-[150vh]"
                                    controls
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    referrerPolicy="no-referrer"
                                    onError={(e) => console.error("Video payload error", e.target.error)}
                                />
                            ) : (
                                <img
                                    src={highResImage}
                                    alt={tweet.title}
                                    className="w-full h-auto object-contain max-h-[150vh]"
                                    loading="lazy"
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TweetPage;
