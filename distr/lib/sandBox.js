import { NodeVM } from 'vm2';
export function evalInSandBox(scope, exp) {
    const vm = new NodeVM({
        sandbox: scope
    });
    return vm.run(exp);
}
