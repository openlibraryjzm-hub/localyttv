/**
 * mauiBridge.js
 * 
 * Unified bridge for communication between React and .NET MAUI.
 * This replaces the hacky inline script in index.html and provides
 * a structured way to invoke C# commands and sync state.
 */

const isMaui = () => {
    return window.location.href.startsWith('http://192.168') || 
           window.location.href.startsWith('http://localhost') ||
           navigator.userAgent.includes('Android');
};

const mauiBridge = {
    callbacks: {},

    /**
     * Invoke a command in C#
     * @param {string} cmd - Command name
     * @param {object} args - Arguments object
     * @returns {Promise}
     */
    invoke: function (cmd, args) {
        if (!isMaui()) {
            console.log(`[Bridge-Mock] Calling C#: ${cmd}`, args);
            return Promise.resolve([]);
        }

        console.log(`[Bridge] Calling C#: ${cmd}`, args);
        return new Promise((resolve, reject) => {
            const id = Math.random().toString(36).substring(7);
            this.callbacks[id] = (result) => {
                console.log(`[Bridge] Received from C#:`, result);
                resolve(result);
                delete this.callbacks[id];
            };

            // Send to C# via a fake URL navigation (maui://)
            // MAUI intercepts this in MainPage.xaml.cs
            window.location.href = `maui://cmd?data=${encodeURIComponent(JSON.stringify({ id, cmd, args }))}`;
        });
    },

    /**
     * Sync state from React to C# (Push-State)
     * @param {object} state - The state object to sync
     */
    syncState: function (state) {
        return this.invoke('sync_player_state', state);
    },

    /**
     * Receiver for commands coming FROM C#
     * This is called via EvaluateJavaScriptAsync in BridgeService.cs
     */
    receiveCommand: function (cmd, args) {
        console.log(`[Bridge] Received Command FROM C#: ${cmd}`, args);
        const event = new CustomEvent('mauiCommand', { detail: { cmd, args } });
        window.dispatchEvent(event);
    }
};

export default mauiBridge;
