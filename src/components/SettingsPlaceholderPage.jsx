import React from 'react';
import PageBanner from './PageBanner';

const SettingsPlaceholderPage = ({ onVideoSelect }) => {
    return (
        <div className="w-full h-full flex flex-col bg-transparent">
            <PageBanner
                title="Settings Placeholder"
                description="This is a placeholder for the new Settings page."
            />
            <div className="flex-1 p-8 text-white flex flex-col items-center justify-center">
                <div className="bg-slate-800/50 p-8 rounded-2xl border border-white/10 max-w-2xl text-center">
                    <h1 className="text-3xl font-bold mb-4 text-emerald-400">Settings</h1>
                    <p className="text-xl text-slate-300">New Page Coming Soon</p>
                    <p className="mt-4 text-slate-400">This page will contain global application settings.</p>
                </div>
            </div>
        </div>
    );
};

export default SettingsPlaceholderPage;
