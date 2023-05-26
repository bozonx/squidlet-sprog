export function isCorrespondingType(value, type) {
    if (!type || type === 'any')
        return true;
    else if (value === null)
        return type === 'null';
    else if (Array.isArray(value))
        return type === 'array';
    else if (typeof value === 'object' && type !== 'object') {
        return value?.constructor?.name === type;
    }
    return typeof value === type;
}
