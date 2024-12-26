import { BeforeEachConditionDto, FilterBuilderConfigHooks, GenColumnNameHookDto } from "./type";
export declare class FilterBuilderConfig {
    private static instance;
    private hooks;
    static getInstance(): FilterBuilderConfig;
    addHooks(hooks: FilterBuilderConfigHooks): void;
    runBeforeEachConditionHook(data: BeforeEachConditionDto): BeforeEachConditionDto;
    runGenColumnNameHook(data: GenColumnNameHookDto): GenColumnNameHookDto;
}
