
const idbStorage = {
    getItem: async (name) => {
        return new Promise((resolve) => {
            const request = indexedDB.open('yttv2-db', 1);

            request.onerror = () => {
                console.error("IndexedDB error:", request.error);
                resolve(null);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('kvs')) {
                    db.createObjectStore('kvs');
                }
            };

            request.onsuccess = (event) => {
                const db = event.target.result;
                try {
                    const transaction = db.transaction(['kvs'], 'readonly');
                    const store = transaction.objectStore('kvs');
                    const getRequest = store.get(name);

                    getRequest.onsuccess = () => {
                        resolve(getRequest.result);
                    };
                    getRequest.onerror = () => resolve(null);
                } catch (e) {
                    console.error("IndexedDB transaction error:", e);
                    resolve(null);
                }
            };
        });
    },
    setItem: async (name, value) => {
        return new Promise((resolve) => {
            const request = indexedDB.open('yttv2-db', 1);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('kvs')) {
                    db.createObjectStore('kvs');
                }
            };

            request.onsuccess = (event) => {
                const db = event.target.result;
                try {
                    const transaction = db.transaction(['kvs'], 'readwrite');
                    const store = transaction.objectStore('kvs');
                    store.put(value, name);

                    transaction.oncomplete = () => resolve();
                    transaction.onerror = (e) => {
                        console.error("IndexedDB write error:", e);
                        resolve();
                    };
                } catch (e) {
                    console.error("IndexedDB transaction error:", e);
                    resolve();
                }
            };
        });
    },
    removeItem: async (name) => {
        return new Promise((resolve) => {
            const request = indexedDB.open('yttv2-db', 1);

            request.onsuccess = (event) => {
                const db = event.target.result;
                try {
                    const transaction = db.transaction(['kvs'], 'readwrite');
                    const store = transaction.objectStore('kvs');
                    store.delete(name);
                    transaction.oncomplete = () => resolve();
                } catch (e) {
                    resolve();
                }
            };
        });
    },
};

export default idbStorage;
