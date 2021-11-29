import { Boom, cidBase32 } from '../../util'
import { api, exposedService } from '.'
import { AppManager } from '../../core/apps'
import { useApp } from '../hooks/useApp'
import { CoreIPFS } from '../../core/ipfs'

@exposedService("apps")
export class Apps {
    @api({ permssion: "apps.admin" })
    async listPrivate() {
        const out = {}
        const list = await AppManager.list()
        for (const app of list) {
            out[app.name] = {
                cid: cidBase32(await app.getCid()),
                prod: (await app.getProd()).addr,
            }
        }
        return out
    }

    @api({ permssion: "apps.admin" })
    async create(name: string) {
        const app = await AppManager.create(name)
        return this.info(name)
    }

    async useLocalApp(name: string) {
        const app = await AppManager.get(name)
        if (!app) throw Boom.notFound('App not found', { name })
        return app
    }

    @api({ permssion: "apps.admin" })
    async info(name: string) {
        const app = await this.useLocalApp(name)
        return Object.assign(await app.getMetadata(), {
            name: app.name,
            cid: cidBase32(await app.getCid()),
            prod: (await app.getProd()).addr,
        })
    }

    @api({ permssion: "apps.admin" })
    async updateDesc(name: string, desc: object) {
        const app = await this.useLocalApp(name)
        await app.editMetadata({ desc })
    }

    @api({ permssion: "apps.admin" })
    async publish(name: string) {
        const app = await this.useLocalApp(name)
        //TODO 调用认证app
        const sign = "Verify_Sign"
        await app.editMetadata({ recordSign: sign })
        await CoreIPFS.inst.name.publish(await app.getCid(), { key: app.name })
        await app.verify()
    }

    @api()
    async thisInfo() {
        return (await useApp()).getMetadata()
    }
}