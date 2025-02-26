import {
  Brackets,
  DataSource,
  EntityMetadata,
  Repository,
  SelectQueryBuilder,
  WhereExpressionBuilder,
} from 'typeorm';
import {
  ConditionData,
  JoinData,
  LogicalOperator,
  OperatorEnum,
  SortOptions,
} from '../../type';
import { FilterBuilderAdapter } from '../FilterBuilderAdapter';
import { SubFilter } from '../../SubFilter';
import { TypeormRelationshipManagement } from './TypeormRelationshipManagement';

type TypeormFilterBuilderAdapterOptions = {
  dataSource?: DataSource;
};
export class TypeormFilterBuilderAdapter<
  T extends object,
> extends FilterBuilderAdapter<T> {
  protected isFistWhereCondition: boolean = true;
  protected selectQueryBuilder: SelectQueryBuilder<T>;
  protected repository: Repository<any>;
  protected datasource: DataSource;
  protected attributes: string[] = [];
  protected selectMethod: 'select' | 'addSelect' = 'addSelect';

  constructor(
    entity: T,
    page: number,
    limit?: number,
    alias?: string,
    options?: TypeormFilterBuilderAdapterOptions,
  ) {
    if (!options?.dataSource)
      throw new Error('You must set dataSource when using TypeOrmAdapter');
    const repo = options.dataSource.getRepository(
      entity as object & { name: string; type: T },
    );
    const tableName = repo.metadata.tableName;
    super(
      new TypeormRelationshipManagement({ dataSource: options.dataSource }),
      tableName,
      page,
      limit,
    );
    this.relationMangement.init(entity, this.getOwnerName());

    this.selectQueryBuilder = repo.createQueryBuilder(this.getOwnerName());
    this.repository = repo;
    this.datasource = options.dataSource;
  }

  handleCondition(conditionData: ConditionData): void {
    this.setConditions(
      this.selectQueryBuilder,
      [conditionData],
      this.getWhereMethodName(),
    );
  }

  handleOrder(columName: string, sortOpts: SortOptions): void {
    this.selectQueryBuilder.addOrderBy(columName, sortOpts);
  }

  handleGroup(columnName: string): void {
    this.selectQueryBuilder.groupBy(columnName);
  }

  handleHaving(): void {
    throw new Error('Method not implemented.');
  }

  async handleRun() {
    if (this.attributes.indexOf('updatedAt') > -1)
      this.handleOrder(
        `${this.relationMangement.findPath('').deepAlias}.updatedAt`,
        'DESC',
      );
    if (this.attributes.length > 0)
      this.selectQueryBuilder[this.selectMethod](this.attributes);

    const cloneSqlBuilder = this.selectQueryBuilder.clone();
    if (this.limit !== '*' && this.limit !== undefined)
      cloneSqlBuilder.skip(this.offset).take(this.limit);
    const [total, items] = await Promise.all([
      this.selectQueryBuilder.getCount(),
      cloneSqlBuilder.getMany(),
    ]);

    return {
      total,
      items,
    };
  }

  handleJoin(dataJoin: JoinData): void {
    const relationship = this.relationMangement.addRelationship(
      dataJoin.path,
      dataJoin.target,
    );
    dataJoin.path = relationship.alias;
    dataJoin.conditions = dataJoin.conditions.map((e) => ({
      ...e,
      path: relationship.alias,
    }));

    let joinMethod:
      | 'innerJoinAndSelect'
      | 'leftJoinAndSelect'
      | 'innerJoin'
      | 'leftJoin';
    if (!dataJoin.attributes)
      joinMethod = dataJoin.required
        ? 'innerJoinAndSelect'
        : 'leftJoinAndSelect';
    else joinMethod = dataJoin.required ? 'innerJoin' : 'leftJoin';

    this.selectQueryBuilder[joinMethod](
      relationship.deepAlias,
      relationship.alias,
    );

    if (dataJoin.conditions)
      dataJoin.conditions.forEach((val) => this.handleCondition(val));

    // Handle select attribute
    if (dataJoin.attributes)
      this.handleSelect(dataJoin.attributes, dataJoin.path);
    else this.attributes.push(relationship.alias);
  }

  getColumns(target?: any): Record<string, any> {
    const repository = target
      ? this.datasource.getRepository(target)
      : this.repository;
    return repository.metadata.columns.reduce(
      (pre, val) => ({ ...pre, [val.propertyName]: val }),
      {},
    );
  }

  handleSelect(attribute: string[], path?: string): void {
    // const selectMethod = path ? 'select' : 'addSelect';
    // if (!attribute.includes('updatedAt') && !path) attribute.push('updatedAt');
    attribute = attribute.map((val) =>
      path ? `${path}.${val}` : `${this.getOwnerName()}.${val}`,
    );
    if (!path) this.selectMethod = 'select';
    this.attributes.push(...attribute);
  }

  handleLogicalOperator<U>(
    operator: LogicalOperator,
    subFilters: SubFilter<U>[],
  ): void {
    const logicalMethod = operator === 'OR' ? 'orWhere' : 'andWhere';
    const whereMethod = this.getWhereMethodName();

    if (subFilters.length > 0)
      this.selectQueryBuilder[whereMethod](
        new Brackets((qb: any) => {
          let method = 'where';
          for (let i = 0; i < subFilters.length; i++) {
            const conditions = subFilters[i].conditionData.conditions.map(
              (condition) => ({
                ...condition,
                path: this.relationMangement.findPath(condition.path ?? '')
                  .alias,
              }),
            );
            if (conditions.length === 0) continue;
            qb[method](
              new Brackets((_qb) => this.setConditions(_qb, conditions)),
            );
            method = logicalMethod;
          }
        }),
      );
  }

  // ==============
  // =======
  // List private function for typeorm
  // =======
  // ==============

  protected setConditions(
    qb: WhereExpressionBuilder,
    data: ConditionData[],
    forceWhereMethod?: 'where' | 'andWhere',
  ) {
    let methodWhere: 'where' | 'andWhere' = 'where';
    for (let i = 0; i < data.length; i++) {
      const [stringQuery, params] = this.parseCondition2Query(data[i]);
      if (forceWhereMethod) methodWhere = forceWhereMethod;
      else if (i === 0) methodWhere = 'where';
      else methodWhere = 'andWhere';
      qb[methodWhere](stringQuery, params);
    }
  }

  protected getWhereMethodName(): 'where' | 'andWhere' {
    const methodName: 'where' | 'andWhere' = this.isFistWhereCondition
      ? 'where'
      : 'andWhere';
    this.isFistWhereCondition = false;
    return methodName;
  }

  protected aliasColumnName(col: string, path?: string) {
    return !path || path === '' ? col : `${path}.${col}`;
  }

  /**
   * Parse ConditionData to Query in SelectQueryBuilder:
   * - Format params
   * - Gen String-query
   */
  protected parseCondition2Query(
    conditionData: ConditionData,
  ): [string, object] {
    let stringQuery = '';
    // eslint-disable-next-line prefer-const
    let { columnName, operator, params, path } = conditionData;
    params = this.formatParams(conditionData);
    const nameParams = Object.keys(params);
    columnName = this.aliasColumnName(columnName, path);

    // Format string Query
    if (operator === 'IN') stringQuery = `${columnName} IN (...:${nameParams})`;
    else if (operator === 'BETWEEN')
      stringQuery = `${columnName} BETWEEN :${nameParams[0]} AND :${nameParams[1]}`;
    else stringQuery = `${columnName} ${operator} :${nameParams}`;
    // END Format string Query

    return [stringQuery, params];
  }

  /**
   * Add Date.now() to columnName to become param's name in
   * select builder (typeorm)
   */
  private uniqueName(columName: string) {
    return columName + '_' + Date.now();
  }

  /** Convert columnName for where-clause params */
  protected formatParams(conditionData: ConditionData) {
    const col = this.aliasColumnName(
      this.uniqueName(conditionData.columnName),
      conditionData.path,
    );
    if (
      conditionData.operator === 'BETWEEN' ||
      (conditionData.operator !== 'IN' && Array.isArray(conditionData.params))
    )
      return {
        [`${col}_1`]: conditionData.params[0],
        [`${col}_2`]: conditionData.params[1],
      };
    if (conditionData.operator === 'ILIKE' || conditionData.operator === 'LIKE')
      return { [col]: `%${conditionData.params}%` };

    return { [col]: conditionData.params };
  }
}
