import { ObjectLiteral, Repository, SelectQueryBuilder } from "typeorm";
import { validate } from "uuid";
import { BaseCondition } from "./BaseCondition";
import { QueryData, SortOptions, OperatorEnum, ResultFilter } from "./type";




export class FilterBuilder<T extends ObjectLiteral> extends BaseCondition {
    private repo: Repository<T>;
    private selectQueryBuilder: SelectQueryBuilder<T>;
    private isFistWhereCondition: boolean = true;

    /**
     * @param repo Repository contain Entity needs filters
     * @param queryData Query Object in request
     * @param alias table name
     */
    constructor(repo: Repository<T>, queryData: QueryData, alias?: string) {
        const tableName = alias ?? repo.metadata.tableName;
        super(queryData, tableName);
        this.repo = repo;
        this.selectQueryBuilder = repo.createQueryBuilder(this.ownerName);
    }



    attribute(attributes: string[]): this {
        this.selectQueryBuilder.select(attributes);
        return this;
    }

    // leftJoin(foreignKey:string, alias:string, condition?: ConditionBuilder):this {
    //     this.selectQueryBuilder.leftJoinAndSelect(foreignKey,alias);

    //     if(condition) {
    //         const subqueries = condition.getSubQuery();
    //         subqueries.forEach(subquery => {
    //             this.selectQueryBuilder[this.getWhereMethodName()](
    //                 subquery[0], subquery[1] 
    //             )
    //         });
    //     }
    //     return this;
    // }

    // innerJoin(foreignKey:string, alias:string, condition?: ConditionBuilder):this {
    //     this.selectQueryBuilder.leftJoinAndSelect(foreignKey,alias);
    //     if(condition) {
    //         const subqueries = condition.getSubQuery();
    //         subqueries.forEach(subquery => {
    //             this.selectQueryBuilder[this.getWhereMethodName()](
    //                 subquery[0], subquery[1] 
    //             )
    //         });
    //     }
    //     return this;
    // }


    order(
        queryFieldName: string,
        columnName?: string,
        defaultValue?: string,
    ): this {
        let { value, columnName: column } = this.formatInputField(queryFieldName, columnName, defaultValue);
        const sortOptions: SortOptions = ((value as string).toUpperCase()) as SortOptions;
        if (sortOptions !== "ASC" && sortOptions !== "DESC") return this;

        const fieldName = this.genAccessFieldName(column);
        this.selectQueryBuilder.orderBy(fieldName, sortOptions);
        return this;
    }

    async run(): Promise<ResultFilter> {
        const skip = this.queryData.page * this.queryData.limit;
        const take = this.queryData.limit;
        const cloneSqlBuilder = this.selectQueryBuilder.clone().skip(skip).take(take);
        try {
            const arrResult = Promise.all(
                [
                    this.selectQueryBuilder.getCount(),
                    (await cloneSqlBuilder.getRawAndEntities())
                ]);
            return {
                currentPage: this.queryData.page,
                limit: this.queryData.page,
                total: arrResult[0],
                items: arrResult[1].entities
            }
        } catch (error) {
            console.error("Filter error!!", error);
            throw error;
        }
    }


    private getWhereMethodName(): "where" | "andWhere" {
        const methodName: "where" | "andWhere" = this.isFistWhereCondition ? "where" : "andWhere";
        this.isFistWhereCondition = false;
        return methodName;
    }

    protected processSql(sql: string, params: object): void {
        const whereMethod = this.getWhereMethodName();
        this.selectQueryBuilder[whereMethod](sql, params);
    }


}