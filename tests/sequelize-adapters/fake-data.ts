import { Model } from "sequelize";

class BaseModel {
  static getAttributes() {}

  static associations = {};

  static tableName: string = "";
}

export class FakeModel extends BaseModel {
  age: number;
  name: string;
  id: number;
  static getAttributes() {
    return {
      age: 1,
      name: "name",
      id: 1,
    };
  }

  static associations = {
    student: {
      as: "student",
      source: { tableName: "fake_model" },
      target: { tableName: "student" },
    },
  };

  static tableName = "fake_model";

  constructor() {
    super();
    this.age = 1;
    this.name = "name";
    this.id = 1;
  }
}

export class FakeStudent extends BaseModel {
  age: number;
  name: string;
  id: number;
  static getAttributes() {
    return {
      age: 1,
      name: "name",
      id: 1,
    };
  }
  static associations: {} = {
    fake_model: {
      as: "fake_model",
      source: { tableName: "student" },
      target: { tableName: "fake_model" },
    },
    courses: {
      as: "courses",
      source: { tableName: "student" },
      target: { tableName: "courses" },
    },
  };

  static tableName: string = "student";

  constructor() {
    super();
    this.age = 1;
    this.name = "name";
    this.id = 1;
  }
}

export class FakeCourse extends BaseModel {
  name: string;
  id: number;
  static getAttributes() {
    return {
      name: "name",
      id: 1,
    };
  }
  static associations: {} = {
    student: {
      as: "students",
      source: { tableName: "courses" },
      target: { tableName: "students" },
    },
  };

  static tableName: string = "courses";
  constructor() {
    super();
    this.name = "name";
    this.id = 1;
  }
}
