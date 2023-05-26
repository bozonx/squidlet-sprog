export function logicAnd(scope) {
    return async (p) => {
        for (const rawItem of p.items) {
            const item = await scope.$resolve(rawItem);
            if (!item)
                return false;
        }
        return true;
    };
}
export function logicOr(scope) {
    return async (p) => {
        for (const rawItem of p.items) {
            const item = await scope.$resolve(rawItem);
            if (item)
                return true;
        }
        return false;
    };
}
export function logicNot(scope) {
    return async (p) => {
        const value = await scope.$resolve(p.value);
        return !value;
    };
}
export function isEqual(scope) {
    return async (p) => {
        const it = await scope.$resolve(p.it);
        const and = await scope.$resolve(p.and);
        return it === and;
    };
}
export function isGreater(scope) {
    return async (p) => {
        const it = await scope.$resolve(p.it);
        const than = await scope.$resolve(p.than);
        return it > than;
    };
}
export function isLess(scope) {
    return async (p) => {
        const it = await scope.$resolve(p.it);
        const than = await scope.$resolve(p.than);
        return it < than;
    };
}
