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
        let prevItem = await scope.$resolve(p.items[0]);
        for (const item of p.items.slice(1)) {
            const itemRes = await scope.$resolve(item);
            if (itemRes !== prevItem)
                return false;
        }
        return true;
    };
}
export function isGreater(scope) {
    return async (p) => {
        const it = await scope.$resolve(p.items[0]);
        const than = await scope.$resolve(p.items[1]);
        return it > than;
    };
}
export function isLess(scope) {
    return async (p) => {
        const it = await scope.$resolve(p.items[0]);
        const than = await scope.$resolve(p.items[1]);
        return it < than;
    };
}
export function isGreaterOrEqual(scope) {
    return async (p) => {
        const it = await scope.$resolve(p.items[0]);
        const than = await scope.$resolve(p.items[1]);
        return it >= than;
    };
}
export function isLessOrEqual(scope) {
    return async (p) => {
        const it = await scope.$resolve(p.items[0]);
        const than = await scope.$resolve(p.items[1]);
        return it <= than;
    };
}
