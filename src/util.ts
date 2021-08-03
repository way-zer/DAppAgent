export async function toArray<T>(gen: AsyncIterable<T> | undefined): Promise<Array<T>> {
    if (!gen) return []
    const arr = [] as T[]
    for await (const item of gen) {
        arr.push(item)
    }
    return arr
}