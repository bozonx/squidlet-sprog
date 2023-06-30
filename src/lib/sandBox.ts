import {NodeVM} from 'vm2'


export function evalInSandBox(scope: Record<any, any>, exp: string) {
  //throw new Error(`VM doesn't work`)
  const vm = new NodeVM({
    sandbox: { scope },
    wrapper: 'none',
  })

  return vm.run(exp)
}
