export const makeFuncProxyHandler = (obj) => {
    return {
        apply(target, thisArg, argArray) {
            return obj.exec(...argArray);
        },
        get(target, p) {
            return obj[p];
        },
        has(target, p) {
            return Boolean(obj[p]);
        }
    };
};
export function makeFuncProxy(obj) {
    function fakeFunction() { }
    return new Proxy(fakeFunction, makeFuncProxyHandler(obj));
}
