import {Application} from '@midwayjs/koa'
import {IpfsService} from '../src/services/ipfs'
import {BufferStore} from 'ipfs-core-types/src/utils'

const {createApp} = require('@midwayjs/mock')
describe('IpfsTest', () => {
    let app: Application
    let ipfsService: IpfsService
    beforeAll(async () => {
        // 只创建一次 app，可以复用
        try {
            // 由于Jest在BeforeAll阶段的error会忽略，所以需要包一层catch
            // refs: https://github.com/facebook/jest/issues/8688

            app = await createApp()
            ipfsService = app.getApplicationContext().get(IpfsService)
        } catch (err) {
            console.error('test beforeAll error', err)
            throw err
        }
    })
    it('should dht route work', async function () {
        const ipfs = ipfsService.inst
        const store = (ipfs.libp2p._dht as BufferStore)

        const key = new Uint8Array([1, 2, 3, 4])
        const value = new Uint8Array([1, 1, 1, 1])
        await store.put(key, value)
        expect(await store.get(key)).toBe(value)
    })
})