import { deepEachObjAsync, deepSet, } from 'squidlet-lib';
import { SuperValueBase, SUPER_VALUE_PROXY_PUBLIC_MEMBERS, SUPER_VALUE_EVENTS, } from './SuperValueBase.js';
import { checkDefinition, isSuperValue, prepareDefinitionItem, SUPER_VALUE_PROP, } from './superValueHelpers.js';
import { isSprogExpr } from '../lang/helpers.js';
export const STRUCT_PUBLIC_MEMBERS = [
    ...SUPER_VALUE_PROXY_PUBLIC_MEMBERS,
    'isStruct',
];
/**
 * Wrapper for SuperStruct which allows to manipulate it as common object.
 * And it puts some methods to it:
 * * struct.$super - instance of SuperStruct
 * * struct... - see other methods in STRUCT_PUBLIC_MEMBERS
 */
export function proxifyStruct(struct) {
    const handler = {
        get(target, prop) {
            // $super
            if (prop === SUPER_VALUE_PROP)
                return struct;
            // public super struct prop
            else if (STRUCT_PUBLIC_MEMBERS.includes(prop))
                return struct[prop];
            // else prop or object itself
            return struct.values[prop];
        },
        has(target, prop) {
            if (prop === SUPER_VALUE_PROP || STRUCT_PUBLIC_MEMBERS.includes(prop))
                return true;
            return struct.allKeys.includes(prop);
        },
        set(target, prop, newValue) {
            return struct.setOwnValue(prop, newValue);
        },
        deleteProperty() {
            throw new Error(`It isn't possible to delete struct value`);
        },
        ownKeys() {
            return struct.allKeys;
        },
    };
    return new Proxy(struct.values, handler);
}
/**
 * SuperStruct.
 * * It is allowed to make en empty struct, but it is useless
 * * It isn't possible to remove items from struct, but it is possible to set null
 */
export class SuperStruct extends SuperValueBase {
    isStruct = true;
    // current values
    values = {};
    proxyFn = proxifyStruct;
    // It assumes that you will not change it after initialization
    definition = {};
    get allKeys() {
        return Object.keys(this.values);
    }
    constructor(definition, defaultRo = false) {
        super();
        for (const keyStr of Object.keys(definition)) {
            checkDefinition(definition[keyStr]);
            const def = prepareDefinitionItem(definition[keyStr], defaultRo);
            if (!def.required && !def.nullable) {
                // TODO: надо убедиться что стоит либо required либо nullable
                //    чтобы нельзя было удалять потомка установив undefined.
                //    ставить null норм
                // TODO: или может автоматом ставить nullable ???
                // throw new Error(
                //   `SuperStruct definition of "${keyStr}" is not required and not nullable!`
                // )
            }
            this.definition[keyStr] = def;
        }
    }
    /**
     * Init with initial values.
     * It returns setter for readonly params
     */
    init = (initialValues) => {
        // TODO: initialValues а если там указанны super значения, а в definition простые?
        if (this.inited)
            throw new Error(`The struct has been already initialized`);
        this.events.emit(SUPER_VALUE_EVENTS.initStart);
        // set initial values
        for (const keyStr of Object.keys(this.definition)) {
            const keyName = keyStr;
            // TODO: если expression вместо значения ?? сразу выполнить или просто пропустить
            this.values[keyName] = this.resolveChildValue(this.definition[keyName], keyStr, initialValues?.[keyName]);
        }
        return super.init();
    };
    destroy = () => {
        super.destroy();
        // destroy all the children
        for (const key of this.allKeys) {
            const keyName = key;
            if (isSuperValue(this.values[keyName])) {
                // it will destroy itself and its children
                this.values[keyName][SUPER_VALUE_PROP].destroy();
            }
        }
    };
    getProxy() {
        return super.getProxy();
    }
    getDefinition(keyStr) {
        const key = keyStr;
        if (!this.definition[key]) {
            throw new Error(`SuperStruct "${this.pathToMe}" doesn't have definiton of child "${keyStr}"`);
        }
        return this.definition[key];
    }
    /////// Struct specific
    /**
     * Execute expressions which set in values or set simple value
     * @param scope
     * @param values - expressions of simple values
     * @param roSetter - setter for ro elements
     */
    async execute(scope, values, roSetter) {
        // TODO: это же в массиве и в data (с учетом наложения)
        const valuesToSet = {};
        await deepEachObjAsync(values, async (obj, key, path) => {
            // TODO: вложенным может быть super data, array и тд???
            //       хотя наверное не может
            if (isSprogExpr(obj)) {
                const res = await scope.$run(obj);
                // if expression
                if (typeof res !== 'undefined')
                    deepSet(valuesToSet, path, res);
            }
            else {
                // if it just simple value
                //deepSet(valuesToSet, path, obj)
            }
        });
        for (const key of Object.keys(valuesToSet)) {
            if (roSetter)
                roSetter(key, valuesToSet[key]);
            else
                this.setOwnValue(key, valuesToSet[key]);
        }
    }
    /**
     * Set value of self readonly value and rise an event
     */
    myRoSetter = (name, newValue) => {
        this.setOwnValue(name, newValue, true);
    };
}
