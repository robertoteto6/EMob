import { useState, useEffect } from "react";

const TIME_UPDATE_INTERVAL = 15_000;

// Custom hook to handle time consistently between server and client
export function useCurrentTime(updateInterval = TIME_UPDATE_INTERVAL) {
    const [currentTime, setCurrentTime] = useState<number>(() => Math.floor(Date.now() / 1000));
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        setIsClient(true);

        const syncTime = () => {
            const now = Math.floor(Date.now() / 1000);
            setCurrentTime((prev) => (prev === now ? prev : now));
        };

        syncTime();

        if (updateInterval <= 0) {
            return;
        }

        const interval = window.setInterval(syncTime, updateInterval);
        return () => window.clearInterval(interval);
    }, [updateInterval]);

    return { currentTime, isClient };
}
