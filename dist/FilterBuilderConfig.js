"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilterBuilderConfig = void 0;
class FilterBuilderConfig {
    constructor() {
        this.hooks = {};
    }
    static getInstance() {
        if (!this.instance)
            this.instance = new FilterBuilderConfig();
        return this.instance;
    }
    addHooks(hooks) {
        this.hooks = hooks;
    }
    runBeforeEachConditionHook(data) {
        if (this.hooks && this.hooks.beforeEachCondition) {
            for (let i = 0; i < this.hooks.beforeEachCondition.length; i++) {
                const hook = this.hooks.beforeEachCondition[i];
                data = hook(data);
            }
        }
        return data;
    }
    runGenColumnNameHook(data) {
        var _a;
        if (this.hooks && ((_a = this.hooks) === null || _a === void 0 ? void 0 : _a.genColumnNameHook))
            return this.hooks.genColumnNameHook(data);
        return data;
    }
}
exports.FilterBuilderConfig = FilterBuilderConfig;
