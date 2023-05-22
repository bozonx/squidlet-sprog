import {SprogItemDefinition, SuperScope} from '../scope.js';
import {SimpleType} from '../types/valueTypes.js';


export function logicAnd(scope: SuperScope) {
  return async (p: { items: (SprogItemDefinition | SimpleType)[] }): Promise<boolean> => {
    for (const rawItem of p.items) {
      const item = await scope.$resolve(rawItem)

      if (!item) return false
    }

    return true
  }
}

export function logicOr(scope: SuperScope) {
  return async (p: { items: (SprogItemDefinition | SimpleType)[] }): Promise<boolean> => {
    for (const rawItem of p.items) {
      const item = await scope.$resolve(rawItem)

      if (item) return true
    }

    return false
  }
}

export function logicNot(scope: SuperScope) {
  return async (p: { value: (SprogItemDefinition | SimpleType) }): Promise<boolean> => {
    const value = await scope.$resolve(p.value)

    return !value
  }
}

export function isEqual(scope: SuperScope) {
  return async (p: {
    it: (SprogItemDefinition | SimpleType),
    and: (SprogItemDefinition | SimpleType),
  }): Promise<boolean> => {
    const it = await scope.$resolve(p.it)
    const and = await scope.$resolve(p.and)

    return it === and
  }
}

export function isGreater(scope: SuperScope) {
  return async (p: {
    it: (SprogItemDefinition | SimpleType),
    than: (SprogItemDefinition | SimpleType),
  }): Promise<boolean> => {
    const it = await scope.$resolve(p.it)
    const than = await scope.$resolve(p.than)

    return it > than
  }
}

export function isLess(scope: SuperScope) {
  return async (p: {
    it: (SprogItemDefinition | SimpleType),
    than: (SprogItemDefinition | SimpleType),
  }): Promise<boolean> => {
    const it = await scope.$resolve(p.it)
    const than = await scope.$resolve(p.than)

    return it < than
  }
}
