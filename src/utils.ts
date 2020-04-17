export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export class OrderedMap<K, V> {
    private ks: K[] = [];
    private readonly map: Map<K, V> = new Map();

    public add(k: K, v: V): void {
        if (this.map.has(k)) {
            this.remove(k);
        }
        this.ks.push(k);
        this.map.set(k, v);
    }

    public remove(k: K): void {
        this.ks = this.ks.filter((key) => key !== k);
        this.map.delete(k);
    }

    public get(k: K): V | undefined {
        return this.map.get(k);
    }

    public firstKey(): K | undefined {
        if (this.ks.length > 0) {
            return this.ks[0];
        }
        return undefined;
    }
}
