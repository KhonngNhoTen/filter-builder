import { FilterBuilderAdapter } from "../../src/adapters/FilterBuilderAdapter";
import { FilterBuilderAdapterFactory } from "../../src/adapters/FilterBuilderAdapterFactory";
import { SequelizeFilterBuilderAdapter } from "../../src/adapters/SequelizeFilterBuilderAdapter";
import { FilterBuilderConfig } from "../../src/FilterBuilderConfig";
import { FilterBuilder } from "../../src/FilterBuilder";
import {
  AdapterType,
  FilterBuilderAdapterFactoryOptions,
} from "../../src/type";
import { FakeModel } from "../sequelize-adapters/fake-data";
import { Op } from "sequelize";
import { Condition } from "../../src/Condition";

FilterBuilderConfig.config({
  type: "sequelize",
  factoryAdapter: class extends FilterBuilderAdapterFactory {
    static create<T extends object>(
      opts: FilterBuilderAdapterFactoryOptions<T>
    ): FilterBuilderAdapter<T> {
      return new SequelizeFilterBuilderAdapter(
        opts.mainTarget,
        opts.page,
        opts.limit
      );
    }
  },
});

describe("Test filter builder", () => {
  let query = { page: 1, limit: 10, age: 1, name: "a", id: 1 };
  let filterBuilder = new FilterBuilder(FakeModel, query);
  let adapter = (filterBuilder as any).adapter;
  beforeEach(() => {
    filterBuilder = new FilterBuilder(FakeModel, query);
    adapter = (filterBuilder as any).adapter;
  });
  describe("1. Test condition", () => {
    it("1.1 Like method", () => {
      filterBuilder.like("name");
      const where = adapter.where;
      expect(where).toEqual({
        name: { [Op.like]: "%a%" },
      });
    });

    it("1.2 range method", () => {
      let query = { id1: 1, id2: 2, page: 1 };
      filterBuilder = new FilterBuilder(FakeModel, query).range(
        ["id1", "id2"],
        "id"
      );
      const where = (filterBuilder as any).adapter.where;
      expect(where).toEqual({
        id: { [Op.between]: [1, 2] },
      });
    });

    it("1.3 make range method", () => {
      let query = { ids: "1,2", page: 1 };
      filterBuilder = new FilterBuilder(FakeModel, query).makeRange(
        "ids",
        (str: string) => str.split(",").map((v) => +v),
        "id"
      );
      const where = (filterBuilder as any).adapter.where;
      expect(where).toEqual({
        id: { [Op.between]: [1, 2] },
      });
    });

    it("1.4 equal method", () => {
      filterBuilder.equal("id");
      const where = adapter.where;
      expect(where).toEqual({
        id: { [Op.eq]: 1 },
      });
    });

    it("1.5 equal method + like method", () => {
      filterBuilder.equal("id").like("name");
      const where = adapter.where;
      expect(where).toEqual({
        id: { [Op.eq]: 1 },
        name: { [Op.like]: "%a%" },
      });
    });
  });

  describe("2. Test join method", () => {
    it("2.1 Left join with condition", () => {
      filterBuilder.leftJoin(new Condition(FakeModel, "student"));
      const join = adapter.selectData;
      expect(join.include[0]).toEqual({
        required: false,
        as: "student",
        model: FakeModel,
        where: {},
      });
    });
  });

  describe("3. Test select attribute", () => {
    it("2.1 Select attribute", () => {
      filterBuilder.attributes(["id", "name"]);
      expect(adapter.selectData.attributes).toEqual(["id", "name"]);
    });

    it("2.2 Skip Select", () => {
      filterBuilder.skipAttributes(["id"]);
      expect(adapter.selectData.attributes).toEqual(["age", "name"]);
    });
  });
});
