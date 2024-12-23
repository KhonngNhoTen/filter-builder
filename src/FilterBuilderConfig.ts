import { BeforeEachConditionDto, FilterBuilderConfigHooks, GenColumnNameHookDto } from "./type";

 export class FilterBuilderConfig {
    private static instance: FilterBuilderConfig;

    private hooks: FilterBuilderConfigHooks = {};
    static getInstance() {
        if (!this.instance) this.instance = new FilterBuilderConfig();
        return this.instance;
    }

    addHooks(hooks: FilterBuilderConfigHooks) {
        this.hooks = hooks;
    }


    runBeforeEachConditionHook(data: BeforeEachConditionDto): BeforeEachConditionDto {
        if (this.hooks && this.hooks.beforeEachCondition) {
            for (let i = 0; i < this.hooks.beforeEachCondition.length; i++) {
                const hook = this.hooks.beforeEachCondition[i]
                data = hook(data);
            }
        }
        return data;
    }

    runGenColumnNameHook(data: GenColumnNameHookDto) {
        if (this.hooks && this.hooks?.genColumnNameHook)
            return this.hooks.genColumnNameHook(data);
        return data;
    }

}