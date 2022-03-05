import {api, ExposedService} from '/@/apis/services/index';
import {useApp} from '/@/apis/hooks/useApp';
import DocumentStore from 'orbit-db-docstore';
import ruleJudgment, {FilterQuery} from 'rule-judgment';

export class DBApi extends ExposedService {
  /**@internal*/
  static async useDatabase(dbName: string) {
    const app = await useApp();
    return await app.getDataBase(dbName);
  }

  @api({permission: 'db.use'})
  async insert<T extends { _id: string }>(dbName: string, body: T) {
    const db = await DBApi.useDatabase(dbName) as DocumentStore<T>;
    return await db.put(body);
  }

  @api({permission: 'db.use'})
  async get<T extends { _id: string }>(dbName: string, _id: string): Promise<T> {
    const db = await DBApi.useDatabase(dbName) as DocumentStore<T>;
    return db.get(_id);
  }

  @api({permission: 'db.use'})
  async delete<T extends { _id: string }>(dbName: string, _id: string) {
    const db = await DBApi.useDatabase(dbName) as DocumentStore<T>;
    return db.del(_id);
  }

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
