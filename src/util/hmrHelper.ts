import.meta.hot?.decline()
let map = new Map<string, any>()

export async function checkChange<T>(id: string, inst: T, body: (old: T) => void | Promise<void>) {
    const old = map.get(id)
    console.log(map)
    map.set(id, inst)
    if (old) {
        await body(old)
    }
}