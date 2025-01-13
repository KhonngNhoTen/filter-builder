export class FakeModel {
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
  static tableName: "fake_model";

  constructor() {
    this.age = 1;
    this.name = "name";
    this.id = 1;
  }
}
