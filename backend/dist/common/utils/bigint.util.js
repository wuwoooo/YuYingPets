"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toNumber = toNumber;
function toNumber(value) {
    if (value === null || value === undefined)
        return null;
    return typeof value === 'bigint' ? Number(value) : value;
}
//# sourceMappingURL=bigint.util.js.map