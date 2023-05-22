
export const makeFuncProxyHandler = (obj: any): ProxyHandler<any> => {
  return {
    apply(target: any, thisArg: any, argArray: any[]) {
      return obj.exec(...argArray)
    },

    get(target: any, p: string): any {
      return obj[p]
    },

    has(target: any, p: string): boolean {
      return Boolean(obj[p])
    }
  }
}

export function makeFuncProxy(obj: any): (() => any) {
  function fakeFunction () {}

  return new Proxy(fakeFunction, makeFuncProxyHandler(obj))
}
