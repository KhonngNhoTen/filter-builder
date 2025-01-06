import { FilterBuilderAdapter } from "./adapters/FilterBuilderAdapter";
import { FilterBuilderConfig } from "./FilterBuilderConfig";
import { IFilter } from "./IFilter";
import { SubFilter } from "./SubFilter";
import { QueryData } from "./type";

export class Condition implements IFilter {
  private funcs: { funcs: keyof IFilter; params: any[] }[];
  target?: any;
  path?: string;
  constructor(target?: any, path?: string) {
    this.funcs = [];
    this.target = target;
    this.path = path;
  }

  attributes(attributes: string[]): this {
    this.funcs.push({
      funcs: "attributes",
      params: [attributes],
    });
    return this;
  }
  skipAttributes(attributes: string[] | "*"): this {
    this.funcs.push({
      funcs: "skipAttributes",
      params: [attributes],
    });
    return this;
  }

  like(
    queryFieldName: string,
    columnName?: string,
    defaultValue?: string
  ): this {
    this.funcs.push({
      funcs: "like",
      params: [queryFieldName, columnName, defaultValue],
    });
    return this;
  }

  iLike(
    queryFieldName: string,
    columnName?: string,
    defaultValue?: string
  ): this {
    this.funcs.push({
      funcs: "iLike",
      params: [queryFieldName, columnName, defaultValue],
    });
    return this;
  }

  equal(
    queryFieldName: string,
    columnName?: string,
    defaultValue?: string
  ): this {
    this.funcs.push({
      funcs: "equal",
      params: [queryFieldName, columnName, defaultValue],
    });
    return this;
  }

  less(
    queryFieldName: string,
    columnName?: string,
    defaultValue?: string
  ): this {
    this.funcs.push({
      funcs: "less",
      params: [queryFieldName, columnName, defaultValue],
    });
    return this;
  }

  greater(
    queryFieldName: string,
    columnName?: string,
    defaultValue?: string
  ): this {
    this.funcs.push({
      funcs: "greater",
      params: [queryFieldName, columnName, defaultValue],
    });
    return this;
  }

  lte(
    queryFieldName: string,
    columnName?: string,
    defaultValue?: string
  ): this {
    this.funcs.push({
      funcs: "lte",
      params: [queryFieldName, columnName, defaultValue],
    });
    return this;
  }

  gte(
    queryFieldName: string,
    columnName?: string,
    defaultValue?: string
  ): this {
    this.funcs.push({
      funcs: "gte",
      params: [queryFieldName, columnName, defaultValue],
    });
    return this;
  }

  in(
    queryFieldName: string,
    columnName?: string,
    defaultValue?: Array<any>
  ): this {
    this.funcs.push({
      funcs: "in",
      params: [queryFieldName, columnName, defaultValue],
    });
    return this;
  }

  uuid(
    queryFieldName: string,
    columnName?: string,
    defaultValue?: string
  ): this {
    this.funcs.push({
      funcs: "uuid",
      params: [queryFieldName, columnName, defaultValue],
    });
    return this;
  }

  range(
    rangeFieldName: string[],
    columnName: string,
    defaultValue?: Array<any>
  ): this {
    this.funcs.push({
      funcs: "range",
      params: [rangeFieldName, columnName, defaultValue],
    });
    return this;
  }

  makeRange(
    queryFieldName: string,
    makeArray: (arg: string) => Array<any>,
    columnName?: string
  ): this {
    this.funcs.push({
      funcs: "makeRange",
      params: [queryFieldName, makeArray, columnName],
    });
    return this;
  }

  or(conditions: Condition[]): this {
    this.funcs.push({
      funcs: "or",
      params: [conditions],
    });
    return this;
  }

  and(conditions: Condition[]): this {
    this.funcs.push({
      funcs: "and",
      params: [conditions],
    });
    return this;
  }

  build<T>(
    queryData: QueryData,
    config: FilterBuilderConfig,
    adapter: FilterBuilderAdapter<T>,
    target?: any,
    path?: string
  ): SubFilter<T> {
    target = this.target ?? target;
    path = this.path ?? path;
    if (!target || !path)
      throw new Error(`Path or Target is undefined when build`);
    const subFilter = new SubFilter(queryData, target, path, config, adapter);
    this.funcs.forEach((val) => {
      (subFilter[val.funcs] as any)(...val.params);
    });
    return subFilter;
  }
}
