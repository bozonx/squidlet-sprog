import { execSuperExp } from '../lib/SuperExp.js';
export const superExp = (scope) => {
    return async (p, scopeReplace) => {
        const type = await scope.$resolve(p.type);
        const args = await scope.$resolve(p.args);
        const resolvedArgs = await Promise.all(args.map((el) => scope.$resolve(el)));
        return execSuperExp(scopeReplace || scope, type, resolvedArgs);
    };
};
