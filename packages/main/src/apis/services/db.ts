import {api, ExposedService} from '/@/apis/services/index';
import {useApp} from '/@/apis/hooks/useApp';
import DocumentStore from 'orbit-db-docstore';

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
}
