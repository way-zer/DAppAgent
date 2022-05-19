import {api, ExposedService} from '/@/apis/services/index';
import {useApp} from '/@/apis/hooks/useApp';
import DocumentStore from 'orbit-db-docstore';
import ruleJudgment, {FilterQuery} from 'rule-judgment';
import Boom from '@hapi/boom';

/**
 * 数据库功能(非关系性文档数据库)
 * 包含数据的 增 删 查
 * 因为去中心化特性，不建议使用数据库作为条件判断依据
 * 需要声明和申请`db.use`权限
 */
export class DBApi extends ExposedService {
    /**@internal*/
    static async useDatabase(dbName: string) {
        const app = await useApp();
        return await app.getDataBase(dbName);
    }

    /**
     * 插入数据
     * @param dbName 在元数据中声明的应用名称
     * @param body 数据内容，需要含_id作为索引键
     */
    @api({permission: 'db.use'})
    async insert<T extends { _id: string }>(dbName: string, body: T) {
        const db = await DBApi.useDatabase(dbName) as DocumentStore<T>;
        return await db.put(body);
    }

    /**
     * 获取单条数据
     * @param dbName 在元数据中声明的应用名称
     * @param _id 数据索引
     */
    @api({permission: 'db.use'})
    async get<T extends { _id: string }>(dbName: string, _id: string): Promise<T> {
        const db = await DBApi.useDatabase(dbName) as DocumentStore<T>;
        const res = db.get(_id);
        if (res.length === 0)
            throw Boom.notFound('date notfound by id', {db: dbName, id: _id});
        return res[0];
    }

    /**
     * 删除单条数据
     * @param dbName 在元数据中声明的应用名称
     * @param _id 数据索引
     */
    @api({permission: 'db.use'})
    async delete<T extends { _id: string }>(dbName: string, _id: string) {
        const db = await DBApi.useDatabase(dbName) as DocumentStore<T>;
        return db.del(_id);
    }

    /**
     * 查询所有数据
     * 可用offset和limit进行分页。默认返回所有
     * @param dbName 在元数据中声明的应用名称
     * @param offset 查询偏置
     * @param limit 返回长度，可配合offset作为分页
     */
    @api({permission: 'db.use'})
    async queryAll<T extends { _id: string }>(
        dbName: string,
        offset: number = 0,
        limit: number = -1,
    ) {
        const db = await DBApi.useDatabase(dbName) as DocumentStore<T>;
        return db.query(() => true)
            .slice(offset, limit === -1 ? undefined : (offset + limit));
    }

    /**
     * 根据条件查询数据
     * 可用offset和limit进行分页。默认返回所有
     * @param dbName 在元数据中声明的应用名称
     * @param filter 查询条件，详情见{@see https://www.npmjs.com/package/rule-judgment}
     * @param offset 查询偏置
     * @param limit 返回长度，可配合offset作为分页
     */
    @api({permission: 'db.use'})
    async query<T extends { _id: string }>(
        dbName: string,
        filter: FilterQuery<T>,
        offset: number = 0,
        limit: number = -1,
    ) {
        const db = await DBApi.useDatabase(dbName) as DocumentStore<T>;
        const result = db.query(ruleJudgment<T>(filter as any));
        return {
            count: result.length,
            offset, limit,
            data: result.slice(offset, limit === -1 ? undefined : (offset + limit)),
        };
    }
}
