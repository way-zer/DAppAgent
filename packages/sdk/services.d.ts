//Auto generated by genType.js
export type AppLocalMeta = {
    firstUse: Timestamp,
    lastUse: Timestamp,
    lastCheckUpdate: Timestamp,
    permissions: Record<string, {
        granted: boolean,
        time: Timestamp
    }>,
    lastLocalProgramDir?: string
};

interface AppsApi {
    /** @api() */
    thisInfo(): Promise<{ name: string; desc: string; icon: string; ext: { [x: string]: any; }; id: string; uniqueId: string; url: string; fork: string | undefined; modifiable: boolean; publicIds: string[]; localData: AppLocalMeta; program: { cid: string; name: string; desc: string; author: string; icon: string; ext: Record<string, unknown>; permissions: { desc: string; node: string; optional: boolean; }[]; databases: { name: string; type: 'docstore' | 'keyvalue' | 'feed' | 'eventlog' | 'counter'; access: 'private' | 'selfWrite'; }[]; singlePageApp: boolean; services: Record<string, { url: string; background: boolean; }>; }; creator: string; updated: number; databases: Record<string, string>; recordSign?: string | undefined; }>;

    /** @api({permission: 'apps.admin'}) */
    list(): Promise<{ id: string; url: string; modifiable: boolean; publicIds: string[]; }[]>;

    /** @api({permission: 'apps.admin'}) */
    info(id: string): Promise<{ name: string; desc: string; icon: string; ext: { [x: string]: any; }; id: string; uniqueId: string; url: string; fork: string | undefined; modifiable: boolean; publicIds: string[]; localData: AppLocalMeta; program: { cid: string; name: string; desc: string; author: string; icon: string; ext: Record<string, unknown>; permissions: { desc: string; node: string; optional: boolean; }[]; databases: { name: string; type: 'docstore' | 'keyvalue' | 'feed' | 'eventlog' | 'counter'; access: 'private' | 'selfWrite'; }[]; singlePageApp: boolean; services: Record<string, { url: string; background: boolean; }>; }; creator: string; updated: number; databases: Record<string, string>; recordSign?: string | undefined; }>;

    /** @api() */
    hasPermission(node: string): Promise<boolean>;

    /** @api() */
    requestPermission(node: string): Promise<true | Boolean>;

    /** @api({permission: 'apps.admin'}) */
    grantPermission(id: string, permissions: string[]): Promise<void>;
}

/** Not resolve */
type WatchDog = {};

export interface Transaction {
    id: string;
    token: string;
    from: string;
    time: number;
    app: string;
    service: string;
    payload: Record<string, unknown>;
    timeout: WatchDog;
    _callback?: (response: Record<string, unknown>) => void;
}

/**
 * 跨应用调用接口
 */
interface CallApi {
    /**
     * 请求某一应用接口,长连接等待返回
     * @param app 被调用应用id
     * @param service 需要调用的接口
     * @param payload 传给接口的参数
     * @return 接口返回结果
     */
    /** @api() */
    request(app: string, service: string, payload: Record<string, unknown>): Promise<Record<string, unknown>>;
    /**
     * 响应请求
     * @param id 调用时,平台传入的事务id
     * @param token 调用时,平台传入的事务token
     * @param response 返回结果
     */
    /** @api() */
    respond(id: string, token: string, response: Record<string, unknown>): Promise<void>;
    /**
     * 获取请求详情
     * @param id 指定TransactionId，不填为所有
     * @param token Transaction Token，被请求app可以不填，如果传递给第三方App需传入
     */
    /** @api() */
    pullTransaction(id?: string, token?: string): Promise<Transaction[]>;
    /**
     * 心跳延时
     * 针对长时间请求,例如oauth登录之类需要用户操作的
     * 需每10s调用一次,保证存活
     */
    /** @api() */
    heartbeat(id: string, token: string): Promise<void>;
}

interface DBApi {
    /** @api({permission: 'db.use'}) */
    insert<T extends { _id: string }>(dbName: string, body: T): Promise<string>;
    /** @api({permission: 'db.use'}) */
    get<T extends { _id: string }>(dbName: string, _id: string): Promise<T>;
    /** @api({permission: 'db.use'}) */
    delete<T extends { _id: string }>(dbName: string, _id: string): Promise<string>;
    /** @api({permission: 'db.use'}) */
    queryAll<T extends { _id: string }>(dbName: string, offset: number = 0, limit: number = -1): Promise<T[]>;
    /** @api({permission: 'db.use'}) */
    query<T extends { _id: string }>(dbName: string, filter: FilterQuery<T>, offset: number = 0, limit: number = -1): Promise<{ count: number; offset: number; limit: number; data: T[]; }>;
}

interface TestApi {
    /** @api() */
    hello(): Promise<string>;
}

/** Not resolve */
type JSONPeerId = {};

interface IntegrateApi {
    /**
     * 通过第三方进行实名认证
     * @return string 认证签名
     */
    /** @api() */
    requestVerified(): Promise<void>;
    /**
     * @internal 内部接口
     * 生成一堆供使用的密钥对
     */
    /** @api() */
    _generateKeyPair(): Promise<JSONPeerId>;
}

interface SystemApi {
    /** @api({permission: 'system.info'}) */
    status(): Promise<{ ipfs: boolean; orbitDB: boolean; versions: { version?: string | undefined; commit?: string | undefined; repo?: string | undefined; system?: string | undefined; golang?: string | undefined; 'ipfs-core'?: string | undefined; 'interface-ipfs-core'?: string | undefined; 'ipfs-http-client'?: string | undefined; }; id: { addresses: string[]; id?: string | undefined; publicKey?: string | undefined; agentVersion?: string | undefined; protocolVersion?: string | undefined; protocols?: string[] | undefined; }; peers: { addr: string; peer: string; latency?: string | undefined; muxer?: string | undefined; streams?: string[] | undefined; direction?: 'inbound' | 'outbound' | undefined; }[]; bandwidth: { totalIn: string; totalOut: string; rateIn: number; rateOut: number; }[]; }>;

    /** @api({permission: 'system.admin'}) */
    connectPeer(addr: string): Promise<void>;

    /** @api({permission: 'system.admin'}) */
    importPeerKey(key0: PeerId.JSONPeerId): Promise<void>;

    /** @api({permission: 'system.admin'}) */
    exportKeys(): Promise<NodeJS.ReadableStream>;

    /** @api({permission: 'system.selectDir'}) */
    selectDir(): Promise<string | null>;
}

export type Services = { test: TestApi; apps: AppsApi; call: CallApi; db: DBApi; system: SystemApi; integrate: IntegrateApi; };
