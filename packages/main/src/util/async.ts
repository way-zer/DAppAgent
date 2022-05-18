export function sleep(time: number) {
    return new Promise(resolve => setTimeout(resolve, time));
}

/**
 * 确保目标函数同一时间只有一个在运行，期间多次调用，执行最后一次
 */
export const debounceLast: MethodDecorator = (_, _2, descriptor) => {
    const origin = descriptor.value as unknown as Function;

    let lock = false;
    let NoLast = Symbol();
    let last: any = NoLast;
    descriptor.value = async function (this: any) {
        if (lock) {
            last = arguments;
            return;
        }
        lock = true;
        await origin.call(this, ...arguments);
        while (last !== NoLast) {
            const next = last;
            last = NoLast;
            await origin.call(this, ...next);
        }
        lock = false;
    } as any;
    return descriptor;
};
/**
 * 确保目标函数仅执行一边,返回Promise
 */
export const onceF: MethodDecorator = (_, _2, descriptor) => {
    const origin = descriptor.value as unknown as Function;

    let ret: Promise<unknown> | null = null;
    descriptor.value = async function (this: any) {
        if (ret)
            return ret;
        ret = (async () => await origin.call(this, ...arguments))();
        return ret;
    } as any;
    return descriptor;
};