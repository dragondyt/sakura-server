import {
  BulkWriteOptions,
  ColumnType,
  DataSource,
  Driver,
  EntityMetadata,
  EntityTarget,
  FindManyOptions,
  FindOneOptions,
  FindOptionsUtils,
  FindOptionsWhere,
  InsertManyResult,
  InsertResult,
  MongoEntityManager,
  ObjectLiteral,
  OptionalId,
  QueryRunner,
  ReplicationMode,
  SaveOptions,
  Table,
  TableColumn,
  TableForeignKey,
  UpdateResult,
} from 'typeorm';
import { CteCapabilities } from 'typeorm/driver/types/CteCapabilities';
import { DataTypeDefaults } from 'typeorm/driver/types/DataTypeDefaults';
import { MappedColumnTypes } from 'typeorm/driver/types/MappedColumnTypes';
import { BaseDataSourceOptions } from 'typeorm/data-source/BaseDataSourceOptions';
import { UpsertType } from 'typeorm/driver/types/UpsertType';
import { SchemaBuilder } from 'typeorm/schema-builder/SchemaBuilder';
import { ColumnMetadata } from 'typeorm/metadata/ColumnMetadata';
import { ReturningType } from 'typeorm/driver/Driver';
import { View } from 'typeorm/schema-builder/view/View';
import { SqlInMemory } from 'typeorm/driver/SqlInMemory';
import { Deta } from 'deta';
import DetaClass from 'deta/dist/types/deta';
import {
  FetchResponse,
  PutManyResponse,
  UpdateResponse,
} from 'deta/dist/types/types/base/response';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import {
  DeleteOptions,
  DeleteResult,
  Document,
  Filter,
} from 'typeorm/driver/mongodb/typings';

export class DetaSchemaBuilder implements SchemaBuilder {
  build(): Promise<void> {
    return Promise.resolve(undefined);
  }

  log(): Promise<SqlInMemory> {
    return Promise.resolve(undefined);
  }
}
export class DetaQueryRunner {
  /**
   * Connection used by this query runner.
   */
  connection: DataSource;
  databaseConnection: DetaClass;
  constructor(connection: DataSource, deta: DetaClass) {
    this.connection = connection;
    this.databaseConnection = deta;
  }

  //
  async cursor(collectionName: string, filter = {}): Promise<FetchResponse> {
    return this.databaseConnection.Base(collectionName).fetch(filter, filter);
  }
  deleteOne(
    collectionName: string,
    filter: Filter<Document>,
    options?: DeleteOptions,
  ): Promise<any> {
    console.log(filter, options);
    return this.databaseConnection
      .Base(collectionName)
      .delete(filter.objectId || filter.key || filter.id);
  }
  async release() {
    // releasing connection are not supported by mongodb driver, so simply don't do anything here
  }

  insertOne<Entity extends ObjectLiteral>(
    collectionName: string,
    entity: Entity | Entity[],
  ) {
    return this.databaseConnection.Base(collectionName).put(entity);
  }

  insertMany(
    collectionName: string,
    docs: OptionalId<Document>[],
    options?: BulkWriteOptions,
  ): Promise<PutManyResponse> {
    return this.databaseConnection
      .Base(collectionName)
      .putMany(docs, (options as any) || {});
  }

  async count<Entity>(
    collectionName: string,
    options: FindManyOptions<Entity>,
  ) {
    const response = await this.databaseConnection
      .Base(collectionName)
      .fetch(options.where as any);
    return response.count;
  }
  async updateMany<Entity>(
    collectionName: string,
    criteria: any,
    partialEntity: QueryDeepPartialEntity<Entity>,
  ) {
    await this.databaseConnection
      .Base(collectionName)
      .update(partialEntity as any, criteria);
    return this.cursor(collectionName, { key: criteria });
  }
}
export interface DetaConnectionOptions extends BaseDataSourceOptions {
  readonly type: 'mongodb';
  projectKey?: string;
}

export class DetaEntityManager extends MongoEntityManager {
  count<Entity extends ObjectLiteral>(
    entityClass: EntityTarget<Entity>,
    options?: FindManyOptions<Entity>,
  ): Promise<number> {
    const metadata = this.connection.getMetadata(entityClass);
    const queryRunner: DetaQueryRunner =
      this.connection.driver.createQueryRunner(
        'master',
      ) as unknown as DetaQueryRunner;
    return queryRunner.count(metadata.tableName, options);
  }

  async find<Entity extends ObjectLiteral>(
    entityClass: EntityTarget<Entity>,
    options?: FindManyOptions<Entity>,
  ): Promise<Entity[]> {
    const metadata = this.connection.getMetadata(entityClass);
    const queryRunner: DetaQueryRunner =
      this.connection.driver.createQueryRunner(
        'master',
      ) as unknown as DetaQueryRunner;
    let { items } = await queryRunner.cursor(metadata.tableName, options.where);
    items = items.map(({ key, ...cmt }: any) => ({
      ...cmt,
      objectId: key,
    }));
    if (FindOptionsUtils.isFindManyOptions(options)) {
      //
    }
    return items as any;
  }

  async findBy<Entity extends ObjectLiteral>(
    entityClass: EntityTarget<Entity>,
    where: FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[],
  ): Promise<Entity[]> {
    const metadata = this.connection.getMetadata(entityClass);
    const queryRunner: DetaQueryRunner =
      this.connection.driver.createQueryRunner(
        'master',
      ) as unknown as DetaQueryRunner;
    let { items } = await queryRunner.cursor(metadata.tableName, where);
    items = items.map(({ key, ...cmt }: any) => ({
      ...cmt,
      objectId: key,
    }));
    return items as any;
  }

  //
  async findOne<Entity extends ObjectLiteral>(
    entityClass: EntityTarget<Entity>,
    options: FindOneOptions<Entity>,
  ): Promise<Entity | null> {
    const metadata = this.connection.getMetadata(entityClass);
    const queryRunner: DetaQueryRunner =
      this.connection.driver.createQueryRunner(
        'master',
      ) as unknown as DetaQueryRunner;
    if (options.where['objectId']) {
      options.where['key'] = options.where['objectId'];
      delete options.where['objectId'];
    }
    let { items } = await queryRunner.cursor(metadata.tableName, options.where);
    items = items.map(({ key, ...cmt }: any) => ({
      ...cmt,
      objectId: key,
    }));
    return items && items.length > 0 ? (items[0] as any) : null;
  }

  async insert<Entity extends ObjectLiteral>(
    target: EntityTarget<Entity>,
    entity: QueryDeepPartialEntity<Entity> | QueryDeepPartialEntity<Entity>[],
  ): Promise<InsertResult> {
    const metadata = this.connection.getMetadata(target);
    const queryRunner: DetaQueryRunner =
      this.connection.driver.createQueryRunner(
        'master',
      ) as unknown as DetaQueryRunner;
    const r = new InsertResult();
    const result = await queryRunner.insertOne(metadata.tableName, entity);
    r.raw = {
      ...result,
      objectId: result.key,
    };
    return r;
  }

  insertMany<Entity>(
    entityClassOrName: EntityTarget<Entity>,
    docs: OptionalId<Document>[],
    options?: BulkWriteOptions,
  ): Promise<InsertManyResult> {
    return super.insertMany(entityClassOrName, docs, options);
  }

  async update<Entity extends ObjectLiteral>(
    target: EntityTarget<Entity>,
    criteria: any,
    partialEntity: QueryDeepPartialEntity<Entity>,
  ): Promise<UpdateResult> {
    const metadata = this.connection.getMetadata(target);
    const u = new UpdateResult();
    const queryRunner: DetaQueryRunner =
      this.connection.driver.createQueryRunner(
        'master',
      ) as unknown as DetaQueryRunner;
    if (Array.isArray(criteria)) {
      //
    } else {
      //
      const result = await queryRunner.updateMany(
        metadata.tableName,
        criteria,
        partialEntity,
      );
      u.raw = result.items;
      u.affected = result.count;
    }
    return Promise.resolve(u);
  }
}
export class DetaDriver implements Driver {
  protected connection: DataSource;
  cteCapabilities: CteCapabilities;
  dataTypeDefaults: DataTypeDefaults;
  isReplicated: boolean;
  mappedDataTypes: MappedColumnTypes;
  options: DetaConnectionOptions;
  spatialTypes: ColumnType[];
  supportedDataTypes: ColumnType[];
  supportedUpsertTypes: UpsertType[];
  transactionSupport: 'simple' | 'nested' | 'none';
  treeSupport: boolean;
  withLengthColumnTypes: ColumnType[];
  withPrecisionColumnTypes: ColumnType[];
  withScaleColumnTypes: ColumnType[];
  queryRunner: DetaQueryRunner;

  constructor(connection: any) {
    this.connection = connection;
    /**
     * Indicates if replication is enabled.
     */
    this.isReplicated = false;
    /**
     * Indicates if tree tables are supported by this driver.
     */
    this.treeSupport = false;
    /**
     * Represent transaction support by this driver
     */
    this.transactionSupport = 'none';
    /**
     * Mongodb does not need to have column types because they are not used in schema sync.
     */
    this.supportedDataTypes = [];
    /**
     * Gets list of spatial column data types.
     */
    this.spatialTypes = [];
    /**
     * Gets list of column data types that support length by a driver.
     */
    this.withLengthColumnTypes = [];
    /**
     * Gets list of column data types that support precision by a driver.
     */
    this.withPrecisionColumnTypes = [];
    /**
     * Gets list of column data types that support scale by a driver.
     */
    this.withScaleColumnTypes = [];
    /**
     * Mongodb does not need to have a strong defined mapped column types because they are not used in schema sync.
     */
    this.mappedDataTypes = {
      createDate: 'int',
      createDateDefault: '',
      updateDate: 'int',
      updateDateDefault: '',
      deleteDate: 'int',
      deleteDateNullable: true,
      version: 'int',
      treeLevel: 'int',
      migrationId: 'int',
      migrationName: 'int',
      migrationTimestamp: 'int',
      cacheId: 'int',
      cacheIdentifier: 'int',
      cacheTime: 'int',
      cacheDuration: 'int',
      cacheQuery: 'int',
      cacheResult: 'int',
      metadataType: 'int',
      metadataDatabase: 'int',
      metadataSchema: 'int',
      metadataTable: 'int',
      metadataName: 'int',
      metadataValue: 'int',
    };
    // -------------------------------------------------------------------------
    // Protected Properties
    // -------------------------------------------------------------------------
    /**
     * Valid mongo connection options
     * NOTE: Keep sync with MongoConnectionOptions
     * Sync with http://mongodb.github.io/node-mongodb-native/3.5/api/MongoClient.html
     */
    // this.validOptionNames = [
    //   'poolSize',
    //   'ssl',
    //   'sslValidate',
    //   'sslCA',
    //   'sslCert',
    //   'sslKey',
    //   'sslPass',
    //   'sslCRL',
    //   'autoReconnect',
    //   'noDelay',
    //   'keepAlive',
    //   'keepAliveInitialDelay',
    //   'connectTimeoutMS',
    //   'family',
    //   'socketTimeoutMS',
    //   'reconnectTries',
    //   'reconnectInterval',
    //   'ha',
    //   'haInterval',
    //   'replicaSet',
    //   'secondaryAcceptableLatencyMS',
    //   'acceptableLatencyMS',
    //   'connectWithNoPrimary',
    //   'authSource',
    //   'w',
    //   'wtimeout',
    //   'j',
    //   'writeConcern',
    //   'forceServerObjectId',
    //   'serializeFunctions',
    //   'ignoreUndefined',
    //   'raw',
    //   'bufferMaxEntries',
    //   'readPreference',
    //   'pkFactory',
    //   'promiseLibrary',
    //   'readConcern',
    //   'maxStalenessSeconds',
    //   'loggerLevel',
    //   // Do not overwrite BaseDataSourceOptions.logger
    //   // "logger",
    //   'promoteValues',
    //   'promoteBuffers',
    //   'promoteLongs',
    //   'domainsEnabled',
    //   'checkServerIdentity',
    //   'validateOptions',
    //   'appname',
    //   // omit auth - we are building url from username and password
    //   // "auth"
    //   'authMechanism',
    //   'compression',
    //   'fsync',
    //   'readPreferenceTags',
    //   'numberOfRetries',
    //   'auto_reconnect',
    //   'minSize',
    //   'monitorCommands',
    //   'useNewUrlParser',
    //   'useUnifiedTopology',
    //   'autoEncryption',
    //   'retryWrites',
    //   'directConnection',
    // ];
    this.cteCapabilities = {
      enabled: false,
    };
    this.options = {
      type: 'mongodb',
      ...connection.options,
    };
    // validate options to make sure everything is correct and driver will be able to establish connection
    // this.validateOptions(connection.options);
    // load mongodb package
    // this.loadDependencies();
    // this.database = DriverUtils_1.DriverUtils.buildMongoDBDriverOptions(
    //   this.options,
    // ).database;
  }

  afterConnect(): Promise<void> {
    return Promise.resolve();
  }

  buildTableName(
    tableName: string,
    schema?: string,
    database?: string,
  ): string {
    return tableName;
  }

  connect(): Promise<void> {
    this.queryRunner = new DetaQueryRunner(
      this.connection,
      Deta(this.options.projectKey),
    );
    return Promise.resolve();
  }

  createFullType(column: TableColumn): string {
    return '';
  }

  createGeneratedMap(metadata, insertedId): ObjectLiteral | undefined {
    return metadata.objectIdColumn.createValueMap(insertedId);
  }

  createParameter(parameterName: string, index: number): string {
    return '';
  }

  createQueryRunner(mode: ReplicationMode): QueryRunner {
    return this.queryRunner as unknown as QueryRunner;
  }

  createSchemaBuilder(): SchemaBuilder {
    return new DetaSchemaBuilder();
  }

  disconnect(): Promise<void> {
    return Promise.resolve(undefined);
  }

  escape(name: string): string {
    return name;
  }

  escapeQueryWithParameters(
    sql: string,
    parameters: ObjectLiteral,
    nativeParameters: ObjectLiteral,
  ): [string, any[]] {
    return ['', []];
  }

  findChangedColumns(
    tableColumns: TableColumn[],
    columnMetadatas: ColumnMetadata[],
  ): ColumnMetadata[] {
    return [];
  }

  getColumnLength(column: ColumnMetadata): string {
    return '';
  }

  isFullTextColumnTypeSupported(): boolean {
    return false;
  }

  isReturningSqlSupported(returningType: ReturningType): boolean {
    return false;
  }

  isUUIDGenerationSupported(): boolean {
    return false;
  }

  normalizeDefault(columnMetadata: ColumnMetadata): string | undefined {
    return undefined;
  }

  normalizeIsUnique(column: ColumnMetadata): boolean {
    return false;
  }

  normalizeType(column: {
    type?: ColumnType | string;
    length?: number | string;
    precision?: number | null;
    scale?: number;
    isArray?: boolean;
  }): string {
    throw new TypeError(
      `MongoDB is schema-less, not supported by this driver.`,
    );
  }

  obtainMasterConnection(): Promise<any> {
    return Promise.resolve(undefined);
  }

  obtainSlaveConnection(): Promise<any> {
    return Promise.resolve(undefined);
  }

  parseTableName(
    target: EntityMetadata | Table | View | TableForeignKey | string,
  ): {
    tableName: string;
    schema?: string;
    database?: string;
  } {
    return undefined;
  }

  prepareHydratedValue(value: any, column: ColumnMetadata): any {
    //
  }

  preparePersistentValue(value: any, column: ColumnMetadata): any {
    //
  }
}
