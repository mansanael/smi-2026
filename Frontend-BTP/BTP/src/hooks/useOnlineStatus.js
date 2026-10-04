import { useState, useEffect } from 'react';

export function useOnlineStatus() {
    const [enLigne, setEnLigne] = useState(navigator.onLine);

    useEffect(() => {
        const on = () => setEnLigne(true);
        const off = () => setEnLigne(false);
        window.addEventListener('online', on);
        window.addEventListener('offline', off);
        return () => {
            window.removeEventListener('online', on);
            window.removeEventListener('offline', off);
        };
    }, []);

    return enLigne;
}