import {
  AdapterType,
  BeforeEachConditionDto,
  BeforeOrderHookDto,
  FilterBuilderConfigHooks,
  FilterConfigOpts,
  GetColumnNameHookDto,
} from "./type";

export class FilterBuilderConfig {
  private static globalConfig: FilterBuilderConfig;
  readonly type: AdapterType;

  static getGlobalConfig() {
    if (!this.globalConfig) return new FilterBuilderConfig();
    return this.globalConfig;
  }

  static config(options: FilterConfigOpts) {
    this.globalConfig = new FilterBuilderConfig(options);
    return this.globalConfig;
  }

  private readonly hooks: FilterBuilderConfigHooks;

  constructor(opts?: FilterConfigOpts) {
    this.hooks = opts?.hooks ?? {};
    this.type = opts?.type ?? "typeorm";
  }

  runBeforeEachConditionHook(
    data: BeforeEachConditionDto
  ): BeforeEachConditionDto {
    if (
      this.hooks?.beforeEachCondition &&
      Array.isArray(this.hooks?.beforeEachCondition)
    ) {
      for (let i = 0; i < this.hooks.beforeEachCondition.length; i++) {
        const hook = this.hooks.beforeEachCondition[i];
        data = hook(data);
      }
    }
    return data;
  }

  runGetColumnNameHook(data: GetColumnNameHookDto) {
    if (this.hooks && this.hooks?.getColumnName)
      return this.hooks.getColumnName(data);
    return data;
  }

  runBeforeOrder(data: BeforeOrderHookDto) {
    if (this.hooks?.beforeOrder && Array.isArray(this.hooks.beforeOrder)) {
      const beforeOrderHooks = this.hooks.beforeOrder;
      for (let i = 0; i < beforeOrderHooks.length; i++) {
        const hook = beforeOrderHooks[i];
        data = hook(data);
      }
    }
    return data;
  }

  runBeforeGroup(columName: string) {
    if (this.hooks?.beforeGroup) columName = this.hooks?.beforeGroup(columName);
    return columName;
  }
}
