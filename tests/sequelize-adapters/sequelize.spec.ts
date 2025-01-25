import { SequelizeFilterBuilderAdapter } from "../../src/adapters/SequelizeFilterBuilderAdapter";
import { SubFilter } from "../../src/SubFilter";
import { FakeCourse, FakeModel, FakeStudent } from "./fake-data";
import { FindOptions, Op } from "sequelize";

describe("Testing sequelize", () => {
  let sequelizeAdapter = new SequelizeFilterBuilderAdapter(FakeModel, 1, 10);
  beforeEach(() => {
    sequelizeAdapter = new SequelizeFilterBuilderAdapter(FakeModel, 1, 10);
  });

  describe(`1. Test genOperator method`, () => {
    it(`1.1 binary operator`, () => {
      const rightClause = sequelizeAdapter.genOperator("=", 1);
      expect(rightClause).toEqual({ [Op.eq]: 1 });
    });
    it(`1.2 "LIKE" operator`, () => {
      const param = 1;
      const rightClause = sequelizeAdapter.genOperator("LIKE", param);
      expect(rightClause).toEqual({ [Op.like]: `%1%` });
    });
    it(`1.3 "BETWEEN" operator`, () => {
      const param = [1, 2];
      const rightClause = sequelizeAdapter.genOperator("BETWEEN", param);
      expect(rightClause).toEqual({ [Op.between]: [1, 2] });
    });
  });

  describe(`2. Test parseConditions method`, () => {
    it(`2.1 binaryOperator + Between`, () => {
      const result = sequelizeAdapter.parseConditions([
        {
          columnName: "id",
          operator: "=",
          params: 1,
        },
        { columnName: "age", operator: "BETWEEN", params: [1, 2] },
      ]);

      expect(result).toEqual({
        id: { [Op.eq]: 1 },
        age: { [Op.between]: [1, 2] },
      });
    });
    it(`2.2 Like + Between`, () => {
      const result = sequelizeAdapter.parseConditions([
        {
          columnName: "id",
          operator: "LIKE",
          params: 1,
        },
        { columnName: "age", operator: "BETWEEN", params: [1, 2] },
      ]);

      expect(result).toEqual({
        id: { [Op.like]: `%1%` },
        age: { [Op.between]: [1, 2] },
      });
    });
    it(`2.3 binaryOperator + Like + Between`, () => {
      const result = sequelizeAdapter.parseConditions([
        {
          columnName: "id",
          operator: "=",
          params: 1,
        },
        { columnName: "age", operator: "LIKE", params: 2 },
        { columnName: "name", operator: "BETWEEN", params: ["1", "2"] },
      ]);

      expect(result).toEqual({
        id: { [Op.eq]: 1 },
        age: { [Op.like]: `%2%` },
        name: { [Op.between]: ["1", "2"] },
      });
    });
  });

  describe(`3. Test findContainIncludeByPath method`, () => {
    let _sequelizeAdapter: any = sequelizeAdapter;
    beforeEach(() => {
      const includes = {
        include: [
          {
            as: "student",
            include: [
              {
                as: "student.course",
              },
            ],
          },
          {
            as: "log",
          },
        ],
      };
      const rootContainer = {
        "": includes,
        student: includes.include[0],
        "student.course": includes.include?.[0].include?.[0],
        log: includes.include[1],
      };

      _sequelizeAdapter = sequelizeAdapter;
      _sequelizeAdapter.selectData = includes;
      _sequelizeAdapter.rootContainer = rootContainer;
    });

    it(`3.1 findIncludeObjectByPath log`, () => {
      const result = _sequelizeAdapter.findIncludeObjectByPath("log");
      expect(result).toEqual({ as: "log" });
    });

    it(`3.2 findIncludeObjectByPath student.course`, () => {
      const result = _sequelizeAdapter.findIncludeObjectByPath("student.course");
      expect(result).toEqual({
        as: "student.course",
      });
    });

    it(`3.3 findIncludeObjectByPath nah (deep not found)`, () => {
      try {
        const result = _sequelizeAdapter.findIncludeObjectByPath("nah");
        expect(true).toBeFalsy();
      } catch (error) {
        expect((error as any).message).toEqual("Not found include object with path: nah");
      }
    });

    it(`3.4 findIncludeObjectByPath student.course.lesson (deep not found)`, () => {
      try {
        const result = _sequelizeAdapter.findIncludeObjectByPath("student.course.lesson");
        expect(true).toBeFalsy();
      } catch (error) {
        expect((error as any).message).toEqual("Not found include object with path: student.course.lesson");
      }
    });
  });

  describe(`4. Test handleCondition method`, () => {
    const where = () => (sequelizeAdapter as any).where;
    const setWhere = (val: any) => ((sequelizeAdapter as any).where = val);
    it(`4.1 Like operator`, () => {
      sequelizeAdapter.handleCondition({
        columnName: "id",
        operator: "LIKE",
        params: 1,
      });
      expect(where()).toEqual({
        id: { [Op.like]: "%1%" },
      });
    });
    it(`4.2 Like + BETWEEN operator`, () => {
      sequelizeAdapter.handleCondition({
        columnName: "id",
        operator: "LIKE",
        params: 1,
      });
      sequelizeAdapter.handleCondition({
        columnName: "age",
        operator: "BETWEEN",
        params: [1, 2],
      });
      expect(where()).toHaveProperty("id", { [Op.like]: `%1%` });
      expect(where()).toHaveProperty("age", { [Op.between]: [1, 2] });
    });

    it(`4.3 Where is "And" Operator`, () => {
      setWhere({ [Op.or]: [{ age: 1 }, { name: "" }] });
      sequelizeAdapter.handleCondition({
        columnName: "id",
        operator: "=",
        params: 1,
      });
      const condition = (where() as any)[Op.and];
      expect(condition).not.toEqual(undefined);
      expect(condition).toContainEqual({ id: { [Op.eq]: 1 } });
      expect(condition).toContainEqual({ [Op.or]: [{ age: 1 }, { name: "" }] });
    });
  });

  describe(`5. Test handleSelect method`, () => {
    const select = (): any => (sequelizeAdapter as any).selectData;
    const setSelect = (val: FindOptions<any>) => ((sequelizeAdapter as any).selectData = val);

    const setRootContainer = (val: any) => ((sequelizeAdapter as any).rootContainer = val);
    it(`5.1 Select attribute success`, () => {
      setSelect({
        where: {},
        limit: 10,
        offset: 1,
      });
      sequelizeAdapter.handleSelect(["age", "id"]);
      expect(select()).toHaveProperty("where", {});
      expect(select()).toHaveProperty("limit", 10);
      expect(select()).toHaveProperty("offset", 1);
      expect(select()).toHaveProperty("attributes", ["age", "id"]);
    });

    it(`5.2 Add attribute (attributes exsits FindObject before call handleSelect method)`, () => {
      setSelect({
        where: {},
        limit: 10,
        offset: 1,
        attributes: ["name"],
      });
      sequelizeAdapter.handleSelect(["age", "id"]);
      expect(select()).toHaveProperty("where", {});
      expect(select()).toHaveProperty("limit", 10);
      expect(select()).toHaveProperty("offset", 1);
      expect(select()).toHaveProperty("attributes", ["name", "age", "id"]);
    });

    it(`5.3 Add attribute for child IncludeObject, by path`, () => {
      // Set up selectData follow structure:
      // <Root> -> [ [Student -> Course], [User]  ]
      const root = {
        where: {},
        include: [
          {
            as: "students",
            include: [{ as: "courses" }],
          },
        ],
      };
      setSelect(root);

      setRootContainer({
        "": root,
        student: root.include[0],
        "student.courses": root.include[0].include?.[0],
      });

      sequelizeAdapter.handleSelect(["id"], "student.courses");
      expect(select()?.include[0]).toEqual({
        as: "students",
        include: [{ as: "courses", attributes: ["id"] }],
      });
    });
  });

  describe(`6. Test handleLogicalOperator method`, () => {
    const where = (): any => (sequelizeAdapter as any).where;
    const setWhere = (val: any) => ((sequelizeAdapter as any).where = val);
    const select = (): any => (sequelizeAdapter as any).selectData;
    const setSelect = (val: FindOptions<any>) => ((sequelizeAdapter as any).selectData = val);

    beforeEach(() => {
      (sequelizeAdapter as any).targets = {
        student: FakeStudent,
        "student.course": FakeCourse,
        "": FakeModel,
      };
      setSelect({ include: [{ as: "student", include: [{ as: "course" }] }] });
    });

    it(`6.1 Add logical "and"`, () => {
      setWhere({});
      sequelizeAdapter.handleLogicalOperator("AND", [
        new SubFilter({ id: 1, studentId: 1, page: 1 }, sequelizeAdapter).equal("id"),
        new SubFilter({ id: 1, studentId: 1, page: 1 }, sequelizeAdapter, "student", FakeStudent).equal("studentId", "id"),
      ]);
      const condition = (where() as any)[Op.and];
      expect(condition).not.toEqual(undefined);
      expect(condition).toContainEqual({ id: { [Op.eq]: 1 } });
      expect(condition).toContainEqual({ [`$student.id$`]: { [Op.eq]: 1 } });
    });

    it(`6.2 Combine binary and logical "Or"`, () => {
      setWhere({ name: "" });
      sequelizeAdapter.handleLogicalOperator("OR", [
        new SubFilter({ id: 1, studentId: 1, page: 1 }, sequelizeAdapter).equal("id"),
        new SubFilter({ id: 1, studentId: 1, page: 1 }, sequelizeAdapter, "student", FakeStudent).equal("studentId", "id"),
      ]);

      const condition = (where() as any)[Op.and];
      expect(condition).not.toEqual(undefined);
      expect(condition).toContainEqual({ name: "" });
      const childCondtion = condition.find((e: any) => e[Op.or] !== undefined)[Op.or];
      expect(childCondtion).not.toEqual(undefined);
      expect(childCondtion).toContainEqual({ id: { [Op.eq]: 1 } });
      expect(childCondtion).toContainEqual({
        [`$student.id$`]: { [Op.eq]: 1 },
      });
    });
  });

  describe(`7. Test handleJoin method`, () => {
    const select = (): any => (sequelizeAdapter as any).selectData;
    const setSelect = (val: FindOptions<any>) => ((sequelizeAdapter as any).selectData = val);

    setSelect({});
    it(`7.1 Join simple target`, () => {
      sequelizeAdapter.handleJoin({
        path: "student",
        target: FakeStudent,
        conditions: [{ columnName: "id", operator: "=", params: 1 }],
        attributes: ["id"],
        required: true,
      });

      expect(select().include).not.toEqual(undefined);
      const includeObject = select().include[0];
      expect(includeObject).toHaveProperty("as", "student");
      expect(includeObject).toHaveProperty("where", { id: { [Op.eq]: 1 } });
      expect(includeObject).toHaveProperty("attributes", ["id"]);
    });

    it(`7.2 Join deep target`, () => {
      sequelizeAdapter.handleJoin({
        path: "student",
        target: FakeStudent,
        conditions: [{ columnName: "id", operator: "=", params: 1 }],
        attributes: ["id"],
        required: true,
      });

      sequelizeAdapter.handleJoin({
        path: "student.course",
        target: FakeCourse,
        conditions: [{ columnName: "id", operator: "=", params: 1 }],
        attributes: ["id"],
        required: true,
      });

      expect(select().include).not.toEqual(undefined);
      const includeObject = select().include[0];
      expect(includeObject).toHaveProperty("as", "student");
      expect(includeObject).toHaveProperty("where", { id: { [Op.eq]: 1 } });
      expect(includeObject).toHaveProperty("attributes", ["id"]);

      const childIncludeObject = includeObject.include[0];

      expect(childIncludeObject).toHaveProperty("as", "courses");
      expect(childIncludeObject).toHaveProperty("where", {
        id: { [Op.eq]: 1 },
      });
      expect(childIncludeObject).toHaveProperty("attributes", ["id"]);
    });
  });
});
