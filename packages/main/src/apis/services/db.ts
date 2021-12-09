import {api, ExposedService} from '/@/apis/services/index';
import {AccessType, DataBase, DBManager} from '/@/core/db';
import {AppsApi} from '/@/apis/services/apps';
import {App} from '/@/core/apps';
import {useApp} from '/@/apis/hooks/useApp';
import DocumentStore from 'orbit-db-docstore';

export class DBApi extends ExposedService {
  @api({permission: 'db.admin'})
  async create(appId: string, name: string, access: AccessType) {
    const app = await AppsApi.useLocalApp(appId);
    const info: DataBase = {name, access, type: 'docstore'};
    info.addr = await DBManager.create(info);
    const metadata = await app.getMetadata();
    await app.editMetadata({databases: (metadata.databases || []).concat(info)});
    return info;
  }

  /**@internal*/
  static async useDatabase(dbName: string, app: App | undefined = undefined) {
    app ||= await useApp();
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
