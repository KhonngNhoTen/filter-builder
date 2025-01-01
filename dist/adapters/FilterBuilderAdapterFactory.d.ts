import { AdapterType } from "../type";
import { FilterBuilderAdapter } from "./FilterBuilderAdapter";
import { FilterBuilderConfig } from "../FilterBuilderConfig";
export declare class FilterBuilderAdapterFactory {
    static create<T extends object>(type: AdapterType | undefined, config: FilterBuilderConfig, opts: {
        core: T;
        page: number;
        limit?: number;
        aliasTableName?: string;
    }): FilterBuilderAdapter<T>;
}
