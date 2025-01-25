import { WhereExpressionBuilder } from "typeorm";
import { TypeormFilterBuilderAdapter } from "../../src/adapters/TypeormFilterBuilderAdapter";
import { FilterBuilderConfig } from "../../src/FilterBuilderConfig";
import { OperatorEnum } from "../../src/type";
import { FakeEntity } from "./fake-entity";
import { FakeRepository, QB } from "./fake-repo";
import { SubFilter } from "../../src/SubFilter";

describe("Test typeorm adapter", () => {
  //#region  SET UP
  FilterBuilderConfig.config({
    type: "typeorm",
    dataSource: {
      getRepository: () => new FakeRepository(),
    },
  });
  let typeormAdapter = new TypeormFilterBuilderAdapter(
    FakeEntity,
    1,
    undefined,
    undefined,
    FilterBuilderConfig.getGlobalConfig(),
  );
  let qb = (typeormAdapter as any).repository.qb.data;

  beforeEach(() => {
    typeormAdapter = new TypeormFilterBuilderAdapter(FakeEntity, 1, undefined, undefined, FilterBuilderConfig.getGlobalConfig());
    qb = (typeormAdapter as any).repository.qb.data;
  });
  //#endregion

  describe("1. Test formatParams method", () => {
    // const formatParams: (columnName: string, params: any) => any = (
    //   typeormAdapter as any
    // ).formatParams;
    let _typeormAdapter = typeormAdapter as any;
    beforeEach(() => {
      (_typeormAdapter as any).uniqueName = (str: string) => str;
    });
    it("1.1 Params is not array", () => {
      const result = _typeormAdapter.formatParams({
        columnName: "id",
        params: 1,
      });
      expect(result).not.toEqual(undefined);
      expect(result).toEqual({ id: 1 });
    });
    it("1.2 Params is array", () => {
      const arr = [1, 2];
      const result = _typeormAdapter.formatParams({
        columnName: "id",
        params: arr,
      });
      expect(result).not.toEqual(undefined);
      expect(result).toEqual({
        id_1: 1,
        id_2: 2,
      });
    });
  });

  describe("2. Test handleCondition method", () => {
    beforeEach(() => {
      (typeormAdapter as any).uniqueName = (str: string) => str;
    });
    it("2.1 Test Like Operator", () => {
      typeormAdapter.handleCondition({
        columnName: "id",
        operator: "LIKE",
        params: "a",
      });
      expect(qb.wheres).toEqual([[`id LIKE :id`, { id: "%a%" }]]);
    });

    it("2.2 Test BETWEEN Operator", () => {
      typeormAdapter.handleCondition({
        columnName: "id",
        operator: "BETWEEN",
        params: [1, 2],
      });
      expect(qb.wheres).toEqual([[`id BETWEEN :id_1 AND :id_2`, { id_1: 1, id_2: 2 }]]);
    });

    it("2.3 Test BETWEEN+ILIKE Operator", () => {
      typeormAdapter.handleCondition({
        columnName: "id",
        operator: "BETWEEN",
        params: [1, 2],
      });

      typeormAdapter.handleCondition({
        columnName: "name",
        operator: "ILIKE",
        params: "a",
      });
      expect(qb.wheres).toEqual([
        [`id BETWEEN :id_1 AND :id_2`, { id_1: 1, id_2: 2 }],
        [`name ILIKE :name`, { name: "%a%" }],
      ]);
    });
  });

  describe("3. Test handleSelect method", () => {
    it("3.1 Add attribute", () => {
      typeormAdapter.handleSelect(["id", "name"], "student");
      expect(qb.select).toEqual([["student.id", "student.name"]]);
    });
  });

  describe("4. Test handleJoin method", () => {
    beforeEach(() => {
      (typeormAdapter as any).uniqueName = (str: string) => str;
    });

    it("4.1 Test inner join without condition", () => {
      typeormAdapter.handleJoin({
        path: "student",
        target: FakeEntity,
        conditions: [],
        required: true,
      });

      expect(qb.join).toEqual([["inner", "student", "student"]]);
    });

    it("4.2 Test left join without condition", () => {
      typeormAdapter.handleJoin({
        path: "student",
        target: FakeEntity,
        conditions: [],
        required: false,
      });

      expect(qb.join).toEqual([["left", "student", "student"]]);
    });

    it("4.3 Test inner join with attribute", () => {
      typeormAdapter.handleJoin({
        path: "student",
        target: FakeEntity,
        conditions: [],
        required: true,
        attributes: ["id"],
      });

      expect(qb.join).toEqual([["inner", "student", "student"]]);
      expect(qb.select).toEqual([["student.id"]]);
    });

    it("4.4 Test left join with attribute", () => {
      typeormAdapter.handleJoin({
        path: "student",
        target: FakeEntity,
        conditions: [],
        required: false,
        attributes: ["id"],
      });

      expect(qb.join).toEqual([["left", "student", "student"]]);
      expect(qb.select).toEqual([["student.id"]]);
    });

    it("4.5 Test inner join with attribute and condition", () => {
      typeormAdapter.handleJoin({
        path: "student",
        target: FakeEntity,
        conditions: [{ columnName: "id", operator: "=", params: 1, path: "student" }],
        required: true,
        attributes: ["id"],
      });

      expect(qb.join).toEqual([["inner", "student", "student"]]);
      expect(qb.wheres).toEqual([[`student.id = :student.id`, { [`student.id`]: 1 }]]);
      expect(qb.select).toEqual([["student.id"]]);
    });

    it("4.6 Test left join with attribute", () => {
      typeormAdapter.handleJoin({
        path: "student",
        target: FakeEntity,
        conditions: [{ columnName: "id", operator: "=", params: 1, path: "student" }],
        required: false,
        attributes: ["id"],
      });

      expect(qb.join).toEqual([["left", "student", "student"]]);
      expect(qb.wheres).toEqual([[`student.id = :student.id`, { [`student.id`]: 1 }]]);
      expect(qb.select).toEqual([["student.id"]]);
    });

    it("4.7 Test left join with a lot of conditions", () => {
      typeormAdapter.handleJoin({
        path: "student",
        target: FakeEntity,
        conditions: [
          { columnName: "id", operator: "=", params: 1, path: "student" },
          {
            columnName: "age",
            operator: "BETWEEN",
            params: [1, 2],
            path: "student",
          },
        ],
        required: false,
        attributes: ["id"],
      });

      expect(qb.join).toEqual([["left", "student", "student"]]);
      expect(qb.wheres).toEqual([
        [`student.id = :student.id`, { [`student.id`]: 1 }],
        [`student.age BETWEEN :student.age_1 AND :student.age_2`, { [`student.age_1`]: 1, [`student.age_2`]: 2 }],
      ]);
      expect(qb.select).toEqual([["student.id"]]);
    });
  });

  describe("5. Test handleLogicalOperator method", () => {
    let query = { page: 1, name: "a", age: 1, id: 1 };
    beforeEach(() => {
      (typeormAdapter as any).uniqueName = (str: string) => str;
    });
    it("5.1 Test AND operator", () => {
      typeormAdapter.handleLogicalOperator("OR", [
        new SubFilter(query, typeormAdapter).gte("age"),
        new SubFilter(query, typeormAdapter, "student", FakeEntity, FilterBuilderConfig.getGlobalConfig()).gte("id"),
      ]);
      expect(qb.wheres).toEqual([
        [`age >= :age`, { age: 1 }],
        [`student.id >= :student.id`, { [`student.id`]: 1 }],
      ]);

      expect(qb.s);
    });
  });
});
