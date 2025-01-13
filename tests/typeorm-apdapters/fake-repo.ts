import { Brackets } from "typeorm";
import { FakeEntity } from "./fake-entity";

export class FakeRepository {
  entity: FakeEntity;
  qb: QB;
  metadata = {
    tableName: "fake-entity",
    columns: Object.keys(FakeEntity.prototype),
  };
  constructor(qb?: any) {
    this.entity = new FakeEntity();
    this.qb = qb ?? new QB();
  }
  createQueryBuilder() {
    return this.qb;
  }
}

export class QB {
  data: {
    wheres?: any[][];
    select: any[][];
    join?: ["inner" | "left", string, string][];
  } = { wheres: [], select: [] };

  where(brackets: Brackets): void;
  where(path: string, alias: any): void;
  where(arg1: unknown, arg2?: any): void {
    if (typeof arg1 === "string")
      if (this.data.wheres) this.data.wheres.push([arg1, arg2]);
    if (arg1 instanceof Brackets) {
      const that = this;
      arg1.whereFactory(that as any);
    }
  }

  andWhere(brackets: Brackets): void;
  andWhere(pat: string, alias: any): void;
  andWhere(arg1: unknown, arg2?: any): void {
    if (typeof arg1 === "string") this.where(arg1, arg2);
    else if (arg1 instanceof Brackets) this.where(arg1);
  }

  orWhere(brackets: Brackets): void;
  orWhere(pat: string, alias: any): void;
  orWhere(arg1: unknown, arg2?: any): void {
    if (typeof arg1 === "string") this.data?.wheres?.push([arg1, arg2]);
    else if (arg1 instanceof Brackets) {
      const that = this;
      arg1.whereFactory(that as any);
    }
  }

  select(attr: string[]) {
    this.data.select.push(attr);
  }

  addSelect(attr: string[]) {
    this.select(attr);
  }

  join(method: "inner" | "left", path: string, alias: string) {
    if (!this.data?.join) this.data.join = [];
    this.data.join.push([method, path, alias]);
  }

  innerJoinAndSelect(path: string, alias: string) {
    this.join("inner", path, alias);
  }
  leftJoinAndSelect(path: string, alias: string) {
    this.join("left", path, alias);
  }
}
