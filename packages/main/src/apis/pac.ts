import type {DarukContext} from 'daruk';
import {controller, get} from 'daruk';
import globalConfig from 'config/main.json';

@controller('/_/')
export class _Pac {
    @get('pac')
    async pac(ctx: DarukContext) {
        ctx.body = `
function FindProxyForURL(url, host) { 
    if(shExpMatch(host, "*.dapp"))
        return 'PROXY 127.0.0.1:${globalConfig.port}'
    return 'DIRECT'
}
        `;
    }
}
