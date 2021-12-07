/// <reference path="../orbit-db-types/Store.d.ts" />
/// <reference types="memoizee" />
declare module "main/src/apis/services/_define" {
    import { Services } from "main/src/apis/services/index";
    export class ExposedService {
        apis: Map<string, ApiMeta>;
        constructor();
    }
    export function useService<T extends keyof Services>(name: T): Services[T];
    export interface ApiMeta {
        permission?: string;
    }
    export function api(meta?: Partial<ApiMeta>): (target: ExposedService, propertyKey: string) => void;
}
declare module "main/src/util/index" {
    import { CID } from 'multiformats';
    export function toArray<T>(gen: AsyncIterable<T> | undefined): Promise<Array<T>>;
    export function decodeText(file: AsyncIterable<Uint8Array>): Promise<string>;
    export function peerIdBase32(pid: string): string;
    export function cidBase32(cid: string | CID): string;
    export function parseCID(cid: string): CID;
}
declare module "main/src/util/hooks" {
    import type { interfaces } from 'inversify';
    export function useInject<T>(t: interfaces.ServiceIdentifier<T>): T;
    export function singletonService<T extends interfaces.Newable<C>, C>(target: T): T;
}
declare module "main/src/core/ipfs" {
    import type { IPFS } from 'ipfs-core';
    import type LibP2P from 'libp2p';
    import { BWResult } from 'ipfs-core-types/types/src/stats';
    import { PeersResult } from 'ipfs-core-types/types/src/swarm';
    export interface Secret {
        id: string;
        name: string;
    }
    type FileContent = AsyncIterable<Uint8Array>;
    export class CoreIPFS {
        static instUnsafe: IPFS | null;
        static libP2PUnsafe: LibP2P | null;
        static get inst(): IPFS;
        static get libp2p(): LibP2P;
        static start(): Promise<void>;
        static stop(): Promise<void>;
        static ipfsStatus(): Promise<{
            running: boolean;
            bandwidth: Array<BWResult>;
            peers: PeersResult[];
        }>;
        static resolveAddr(addr: string): Promise<string>;
        static getFile(path0: string): Promise<FileContent>;
    }
}
declare module "main/src/core/db/accessController" {
    import OrbitDBAccessController from 'orbit-db-access-controllers/src/orbitdb-access-controller';
    export type AccessType = 'private' | 'selfWrite';
    export class MyAccessController extends OrbitDBAccessController {
        static register(): void;
        static get type(): string;
        static create(orbitDB: any, options: {
            address?: string;
            name?: string;
            type: MyAccessController['type'];
            subType: AccessType;
        }): Promise<MyAccessController>;
        /**
         * private: 仅发布者本人可读写 (或admin组)
         * selfWrite: 所有人可修改本人发布内容,admin组仍可修改所有
         */
        subType: AccessType;
        canAppend(entry: any, identityProvider: any): Promise<boolean>;
        save(): Promise<{
            address: string;
        } & {
            subType: AccessType;
        }>;
    }
}
declare module "main/src/core/db" {
    import OrbitDB from 'orbit-db';
    import type OrbitDBStore from 'orbit-db-store';
    import memoizee from 'memoizee';
    import type { AccessType as AccessType0 } from "main/src/core/db/accessController";
    export type DBType = 'docstore' | 'keyvalue' | 'feed' | 'eventlog' | 'counter';
    export type AccessType = AccessType0;
    export interface DataBase {
        name: string;
        type: DBType;
        access: AccessType;
        addr?: string;
    }
    export type DBStore = OrbitDBStore;
    /**
     * OrbitDB封装类
     * 数据库类型 docstore keyvalue feed eventlog counter
     */
    export class DBManager {
        static instUnsafe: OrbitDB | null;
        static get inst(): OrbitDB;
        static start(): Promise<void>;
        static create(info: DataBase): Promise<string>;
        static getDataBase: ((info: DataBase) => Promise<OrbitDBStore>) & memoizee.Memoized<(info: DataBase) => Promise<OrbitDBStore>>;
        static stop(): Promise<void>;
    }
}
declare module "main/src/core/apps" {
    import { CID } from 'multiformats';
    import type { DataBase, DBStore } from "main/src/core/db";
    import memoizee from 'memoizee';
    export interface AppDesc {
        title: string;
        desc: string;
        author: string;
        icon: string;
        tags: string[];
        links: Record<string, string>;
    }
    export interface AppMetadata {
        recordSign?: string;
        permissions: string[];
        databases: DataBase[];
        desc: Partial<AppDesc>;
    }
    export abstract class App {
        readonly id: string;
        readonly addr: string;
        static verifier: (app: App) => Promise<boolean>;
        /**
         * @param id like dev:test ipfs:xxx
         * @param addr /ipns/ for prod or ipfs for dev
         */
        protected constructor(id: string, addr: string);
        isProd(): boolean;
        verify(): Promise<boolean>;
        protected cache_Metadata?: Promise<AppMetadata>;
        getMetadata(): Promise<AppMetadata>;
        getFile(path: string): Promise<AsyncIterable<Uint8Array>>;
        getDataBase(name: string): Promise<DBStore>;
        hasPermission(permission: string): boolean;
        getService(name: string): Promise<any>;
    }
    export class PublicApp extends App {
        constructor(id: any, addr: any);
    }
    export class PrivateApp extends App {
        readonly name: string;
        constructor(name: string);
        getCid(): Promise<CID>;
        init(): Promise<void>;
        getProd(): Promise<PublicApp>;
        /**
         * 当路径为/结尾时,仅新建目录
         */
        uploadFile(path: string, data: string | Uint8Array | Blob | AsyncIterable<Uint8Array>): Promise<void>;
        /**
         * @param options 需要相关的属性
         */
        editMetadata(options: Partial<AppMetadata>): Promise<void>;
        setMetadata(content: AppMetadata): Promise<void>;
    }
    export class AppManager {
        static resolveAddr(id: string): Promise<string>;
        static list(): Promise<PrivateApp[]>;
        static getPrivate: ((name: string) => Promise<PrivateApp>) & memoizee.Memoized<(name: string) => Promise<PrivateApp>>;
        static create(name: string): Promise<PrivateApp>;
        static getPublic: ((id: string, verify?: any) => Promise<PublicApp>) & memoizee.Memoized<(id: string, verify?: any) => Promise<PublicApp>>;
    }
}
declare module "main/src/apis/hooks/simple" {
    import type { DarukContext } from 'daruk';
    import "zone.js";
    export function useParam(ctx: DarukContext, key: string): string;
    export function useQuery(ctx: DarukContext, key: string): string;
    export function useContext(): DarukContext;
}
declare module "main/src/apis/hooks/useApp" {
    import { PrivateApp } from "main/src/core/apps";
    import type { DarukContext } from 'daruk';
    export function useAppId(ctx?: DarukContext): string;
    export function useApp(ctx?: DarukContext): Promise<import("/@/core/apps").PublicApp>;
    export function usePrivateApp(ctx?: DarukContext): Promise<PrivateApp>;
}
declare module "main/src/apis/services/apps" {
    import { ExposedService } from "main/src/apis/services/index";
    export class AppsApi extends ExposedService {
        listPrivate(): Promise<{}>;
        create(name: string): Promise<{
            name: string;
            cid: string;
            prod: string;
            recordSign?: string;
            permissions: string[];
            databases: import("main/src/core/db").DataBase[];
            desc: Partial<import("/@/core/apps").AppDesc>;
        }>;
        static useLocalApp(name: string): Promise<import("/@/core/apps").PrivateApp>;
        info(name: string): Promise<{
            name: string;
            cid: string;
            prod: string;
            recordSign?: string;
            permissions: string[];
            databases: import("main/src/core/db").DataBase[];
            desc: Partial<import("/@/core/apps").AppDesc>;
        }>;
        updateDesc(name: string, desc: object): Promise<void>;
        publish(name: string): Promise<void>;
        thisInfo(): Promise<import("/@/core/apps").AppMetadata>;
    }
}
declare module "main/src/apis/services/call" {
    import { ExposedService } from "main/src/apis/services/index";
    /**
     * 跨应用调用接口
     */
    export class CallApi extends ExposedService {
        /**
         * 请求某一应用接口,长连接等待返回
         * @param app 被调用应用id
         * @param service 需要调用的接口
         * @param payload 传给接口的参数
         */
        request(app: string, service: string, payload: object): Promise<unknown>;
        /**
         * 响应请求
         * @param id 调用时,平台传入的事务id
         * @param token 调用时,平台传入的事务token
         * @param response 返回结果
         */
        respond(id: string, token: string, response: object): Promise<void>;
        pullTransaction(): Promise<Transaction[]>;
        /**
         * 心跳延时
         * 针对长时间请求,例如oauth登录之类需要用户操作的
         * 需每10s调用一次,保证存活
         */
        heartbeat(id: string, token: string): Promise<void>;
        private transactions;
    }
    export interface Transaction {
        id: string;
        token: string;
        from: string;
        time: number;
        app: string;
        service: string;
        payload: object;
        timeout?: number;
        _callback?: (response: object) => void;
    }
}
declare module "main/src/apis/services/db" {
    import { ExposedService } from "main/src/apis/services/index";
    import { AccessType, DataBase } from "main/src/core/db";
    import { App } from "main/src/core/apps";
    export class DBApi extends ExposedService {
        create(appId: string, name: string, access: AccessType): Promise<DataBase>;
        static useDatabase(dbName: string, app?: App | undefined): Promise<import("orbit-db-store").default>;
        insert<T extends {
            _id: string;
        }>(dbName: string, body: T): Promise<string>;
        get<T extends {
            _id: string;
        }>(dbName: string, _id: string): Promise<T>;
        delete<T extends {
            _id: string;
        }>(dbName: string, _id: string): Promise<string>;
        queryAll<T extends {
            _id: string;
        }>(dbName: string, offset?: number, limit?: number): Promise<T[]>;
    }
}
declare module "main/src/apis/services/file" {
    import { ExposedService } from "main/src/apis/services/index";
    import { MFSEntry } from 'ipfs-core/types/src/components/files/ls';
    export class FileApi extends ExposedService {
        list(path?: string): Promise<(MFSEntry & {
            cid: string;
        })[]>;
        /**
         * 上传文件,或复制文件
         * 上传需先通过/ipfs/upload接口换取cid
         */
        upload(appName: string, path: string, cid: string): Promise<void>;
        mkdir(appName: string, path: string): Promise<void>;
        delete(appName: string, path: string): Promise<void>;
    }
}
declare module "main/src/apis/services/system" {
    import { ExposedService } from "main/src/apis/services/index";
    export class SystemApi extends ExposedService {
        status(): Promise<{
            ipfs: boolean;
            orbitDB: boolean;
            bandwidth: {
                totalIn: string;
                totalOut: string;
                rateIn: number;
                rateOut: number;
            }[];
            peers: {
                addr: string;
                peer: string;
                latency?: string;
                muxer?: string;
                streams?: string[];
                direction?: "inbound" | "outbound";
            }[];
        }>;
        connectPeer(addr: string): Promise<void>;
    }
}
declare module "main/src/apis/services/index" {
    export { ExposedService, api, useService } from "main/src/apis/services/_define";
    import { ExposedService } from "main/src/apis/services/_define";
    import { AppsApi } from "main/src/apis/services/apps";
    import { CallApi } from "main/src/apis/services/call";
    import { DBApi } from "main/src/apis/services/db";
    import { FileApi } from "main/src/apis/services/file";
    import { SystemApi } from "main/src/apis/services/system";
    class TestApi extends ExposedService {
        hello(): Promise<string>;
    }
    export const services: {
        test: TestApi;
        apps: AppsApi;
        call: CallApi;
        db: DBApi;
        file: FileApi;
        system: SystemApi;
    };
    export type Services = typeof services;
    export type { ApiMeta } from "main/src/apis/services/_define";
}
declare module "sdk/index" {
    import type { Services } from "main/src/apis/services/index";
    export type { Services } from "main/src/apis/services/index";
    /** Set this if using custom library */
    export var postFunction: (url: string, body: any[]) => Promise<any>;
    export function useService<T extends keyof Services>(serviceName: T): Omit<Services[T], 'apis'>;
}
