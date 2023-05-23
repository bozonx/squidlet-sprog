import {deepSet, omitObj} from 'squidlet-lib';
import {SuperScope} from '../scope.js';
import {AllTypes} from '../types/valueTypes.js';
import {SuperValueBase, isSuperValue, SUPER_VALUE_PROP} from './SuperValueBase.js';
import {isCorrespondingType} from './isCorrespondingType.js';
import {SuperItemDefinition, SuperItemInitDefinition} from '../types/SuperItemDefinition.js';


/**
 * Wrapper for SuperStruct which allows to manipulate it as common object
 */
export function proxyStruct(struct: SuperStruct): SuperStruct {
  const handler: ProxyHandler<Record<any, any>> = {
    get(target: SuperStruct, p: string) {
      return struct.getValue(p)
    },

    has(target: SuperStruct, p: string): boolean {
      return struct.has(p)
    },

    set(target: SuperStruct, p: string, newValue: any): boolean {
      struct.setValue(p, newValue)

      return true
    },

    deleteProperty(target: SuperStruct, p: string): boolean {
      throw new Error(`It isn't possible to delete struct value`)
    },

    ownKeys(target: SuperStruct): ArrayLike<string | symbol> {
      return Object.keys(omitObj(struct.values, SUPER_VALUE_PROP))
    },

    // defineProperty?(target: T, property: string | symbol, attributes: PropertyDescriptor): boolean;
    // getOwnPropertyDescriptor?(target: T, p: string | symbol): PropertyDescriptor | undefined;
  }

  const a = struct.values as any

  a[SUPER_VALUE_PROP] = struct

  // a.__proto__.init = struct.init
  // a.__proto__.destroy = struct.destroy
  // a.__proto__.has = struct.has
  // a.__proto__.getValue = struct.getValue
  // a.__proto__.setValue = struct.setValue
  // a.__proto__.resetValue = struct.resetValue
  // a.__proto__.clone = struct.clone
  // a.__proto__.link = struct.link

  return new Proxy(struct.values, handler) as SuperStruct
}


export class SuperStruct<T = Record<string, AllTypes>> extends SuperValueBase<T> {
  // It assumes that you will not change it after initialization
  readonly definition: Record<keyof T, SuperItemDefinition> = {} as any
  // current values
  readonly values = {} as T


  constructor(
    scope: SuperScope,
    definition: Record<keyof T, SuperItemInitDefinition>,
    defaultRo: boolean = false
  ) {
    super(scope)

    this.definition = this.prepareDefinition(definition, defaultRo)
  }


  /**
   * Init with initial values.
   * It returns setter for readonly params
   */
  init = (initialValues?: T): ((name: keyof T, newValue: AllTypes) => void) => {
    if (this.inited) {
      throw new Error(`The struct has been already initialized`)
    }
    // set initial values
    for (const keyStr of Object.keys(this.definition)) {
      const keyName = keyStr as keyof T

      this.values[keyName] = this.initChild(
        this.definition[keyName],
        keyStr,
        initialValues?.[keyName]
      )
    }

    // check required values
    for (const keyStr of Object.keys(this.definition)) {
      const keyName = keyStr as keyof T
      if (this.definition[keyName].required && typeof this.values[keyName] === 'undefined') {
        throw new Error(`The value ${keyStr} is required, but it wasn't initiated`)
      }
    }

    // TODO: link all the super children
    // start listen for child changes
    //superVal.subscribe(this.handleChildChange)

    return super.init()
  }

  destroy = () => {
    super.destroy()

    for (const key of Object.keys(this.values as any)) {
      const keyName = key as keyof T
      if (isSuperValue(this.values[keyName])) {
        (this.values[keyName] as SuperValueBase<T>).destroy()
      }
    }
  }


  link = () => {
    // TODO: прилинковать значения разных struct, array или primitive
    //       чтобы эти значения менялись одновременно
  }


  /**
   * Set value of self readonly value and rise an event
   */
  protected myRoSetter = (name: keyof T, newValue: any) => {
    this.safeSetOwnValue(name, newValue, true)
    this.riseChildrenChangeEvent(name as string)
  }

  /**
   * Set value for my self or deeply.
   * It emits an event only if the deep value isn't a super type
   */
  private smartSetValue(pathTo: string, value: AllTypes) {

    // TODO: нужно ставить значение примитива через родителя
    // TODO: use readonly

    if (pathTo.indexOf('.') === -1) {
      // own value
      this.safeSetOwnValue(pathTo as keyof T, value)
    }
    else {
      // deep value
      deepSet(this.values as any, pathTo, value)
    }

    // rise an event only if it is my children and it isn't a super value
    // super value will rise an event by itself
    // // TODO: простые типы могут быть deeply
    // if (
    //   pathTo.indexOf('.') === -1
    //   typeof this.definition[pathTo] === 'undefined'
    //   && !isSuperValue(this.values[pathTo])
    // ) {
    //   this.riseChildrenChangeEvent(pathTo as keyof T)
    // }
  }

  private safeSetOwnValue(name: keyof T, value: AllTypes, ignoreRo: boolean = false) {
    if (typeof this.definition[name] === 'undefined') {
      throw new Error(
        `Can't set value with name ${String(name)} which isn't defined in definition`
      )
    }
    else if (!ignoreRo && this.definition[name].readonly) {
      throw new Error(`Can't set readonly value of name ${String(name)}`)
    }
    else if (!isCorrespondingType(value, this.definition[name].type)) {
      throw new Error(
        `The value ${String(name)} is not corresponding type ${this.definition[name].type}`
      )
    }

    this.values[name] = value as any
  }

  private handleChildChange = (target: SuperValueBase, childPath?: string) => {
    const fullPath = (this.myPath) ? this.myPath + '.' + childPath : childPath

    // TODO: что должно происходить если изменился потомок ???
    // TODO: наверное поднять событие у себя но с данными от потомка?
    // TODO: или поднять событие у себя как будто сам изменился?

    this.changeEvent.emit(target, fullPath)
  }

  private prepareDefinition(
    definition: Record<keyof T, SuperItemInitDefinition>,
    defaultRo: boolean
  ): Record<keyof T, SuperItemDefinition> {
    const res: Record<keyof T, SuperItemDefinition> = {} as any

    for (const keyStr of Object.keys(definition)) {
      const keyName = keyStr as keyof T
      res[keyName] = {
        ...definition[keyName],
        required: Boolean(definition[keyName].required),
        readonly: (defaultRo)
          ? definition[keyName].readonly !== false
          : Boolean(definition[keyName].readonly),
      }
    }

    return res
  }

}


// const a = new SuperStruct({} as any, {
//   p1: {type: 'string', default: 'a'}
// } as any)
// const b = proxyStruct(a)
//
// a.init({p1: 'b'})
//
// console.log(1,b.getValue('p1'))
// console.log(2,(b as any)['p1'])
// console.log(3,Object.keys(b))
