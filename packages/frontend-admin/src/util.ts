import {useState} from 'react';

export function useRefreshAble(): { key: unknown, refresh(): void } {
    const [key, refresh] = useState(Math.random);
    return {
        key,
        refresh() {
            refresh(Math.random);
        },
    };
}