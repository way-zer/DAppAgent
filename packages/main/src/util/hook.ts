import {AsyncLocalStorage} from 'async_hooks';

interface ContextHook<T> {
  (): T;

  contextHook: true;
}

type ContextHookPair<T> = [ContextHook<T>, T]
type ContextStore = Map<ContextHook<any>, any>
const localContexts = new AsyncLocalStorage<ContextStore>();

function mergeStore(old: ContextStore | undefined, ctx: ContextHookPair<unknown>[]): ContextStore {
  if (!old) return new Map(ctx);
  const store = new Map(old);
  for (const [k, v] of ctx) {
    store.set(k, v);
  }
  return store;
}

/** Special Hook Method,can as context */
export function contextHook<T>(f: () => T): ContextHook<T> {
  const impl: ContextHook<T> = () => {
    const store = localContexts.getStore();
    if (store && store.has(impl))
      return store.get(impl) as T;
    return f();
  };
  impl.contextHook = true;
  return impl;
}

export function withContext<T>(body: () => T, ...ctx: ContextHookPair<unknown>[]): T {
  return localContexts.run(mergeStore(localContexts.getStore(), ctx), body);
}
