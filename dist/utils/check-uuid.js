"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkUuid = void 0;
const checkUuid = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
exports.checkUuid = checkUuid;
