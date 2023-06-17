import { EXP_MARKER } from '../constants.js';
import { SUPER_EXP_TYPE } from '../lib/SuperExp.js';
export function isSprogLang(someValue) {
    if (!someValue || typeof someValue !== 'object')
        return false;
    return Boolean(someValue[EXP_MARKER]);
}
export function isSprogExpr(someValue) {
    if (!someValue || typeof someValue !== 'object' || !someValue[EXP_MARKER])
        return false;
    return Boolean(SUPER_EXP_TYPE[someValue[EXP_MARKER]]);
}
