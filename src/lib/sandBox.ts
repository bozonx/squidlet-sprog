//import {NodeVM} from 'vm2'


// TODO: действительно ли это безопасно???
// TODO: нужно ли дополнительно делать sanitize ??

export function evalInSandBox(scope: Record<any, any>, exp: string) {
  const proxyTarget = {
    // eval(code: string) {
    //   //return eval(code)
    // },
  }

  const proxyHandler: ProxyHandler<any> = {
    get(target: any, property: string) {
      console.log(111, target, property)
      if (property === 'eval') return (x: any) => eval.apply(scope, x)
      if (Object.keys(scope).includes(String(property))) return scope[property]

      return undefined
    },
    // This function will be called when the untrusted code tries to call a global function.
    apply(target: any, thisArg: any, args: any[]) {
      console.log(target, thisArg, args, this)

      return
      // Check if the function is a security risk.
      // if (functionName === "eval") {
      //   // Prevent the function from being called.
      //   return;
      // } else {
      //   // Call the original function.
      //   return target[functionName](thisArg, args);
      // }
    },
  }

  const proxy = new Proxy(proxyTarget, proxyHandler);

  // Run the untrusted code through the proxy.
  const res = proxy.eval(exp);

  return res

  //throw new Error(`VM doesn't work`)
  // const vm = new NodeVM({
  //   sandbox: { scope },
  //   wrapper: 'none',
  // })
  //
  // return vm.run(exp)
}
