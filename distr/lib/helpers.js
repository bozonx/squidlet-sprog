const TYPE_INITIAL_VALUES = {
    string: '',
    number: 0,
    boolean: false,
    'null': null,
    array: [],
    object: {},
};
export function resolveInitialSimpleValue(type, nullable = false) {
    if (nullable)
        return null;
    const res = TYPE_INITIAL_VALUES[type];
    if (typeof res === 'undefined')
        throw new Error(`Bad type ${type}`);
    return res;
}
