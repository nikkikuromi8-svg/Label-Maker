export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const store: Record<string, string> = {};
        const polyfill = {
            getItem: (key: string): string | null => store[key] ?? null,
            setItem: (key: string, value: string): void => { store[key] = String(value); },
            removeItem: (key: string): void => { delete store[key]; },
            clear: (): void => { Object.keys(store).forEach(k => delete store[k]); },
            get length(): number { return Object.keys(store).length; },
            key: (n: number): string | null => Object.keys(store)[n] ?? null,
        };
        // Fill in any missing methods on Next.js's partial polyfill, or set from scratch
        if (typeof (global as any).localStorage === 'undefined' ||
            typeof (global as any).localStorage.getItem !== 'function') {
            (global as any).localStorage = polyfill;
        }
    }
}
