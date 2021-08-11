import { useContext } from "@midwayjs/hooks-core";
import { Context } from "@midwayjs/koa";

export function useApp(): string|null {
    const hostname = useContext<Context>().hostname
    const sp = hostname.lastIndexOf('.')
    return hostname.substr(0, sp)
}