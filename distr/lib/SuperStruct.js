import { SIMPLE_TYPES } from '../types/valueTypes.js';
import { SuperValueBase, SUPER_VALUE_PROP, SUPER_PROXY_PUBLIC_MEMBERS, checkDefinition, prepareDefinitionItem, SUPER_VALUE_EVENTS, validateChildValue, } from './SuperValueBase.js';
import { resolveInitialSimpleValue } from './helpers.js';
export const STRUCT_PUBLIC_MEMBERS = [
    ...SUPER_PROXY_PUBLIC_MEMBERS,
    'isStruct',
];
export function checkValueBeforeSet(isInitialized, definition, key, value, ignoreRo = false) {
    if (!isInitialized)
        throw new Error(`Init it first`);
    else if (!definition)
        throw new Error(`Doesn't have key ${key}`);
    // obviously check it otherwise it will be set to default
    else if (typeof value === 'undefined') {
        throw new Error(`It isn't possible to set undefined to data child`);
    }
    else if (!ignoreRo && definition.readonly) {
        throw new Error(`Can't set readonly value of name ${key}`);
    }
}
/**
 * Wrapper for SuperStruct which allows to manipulate it as common object.
 * And it puts some methods to it:
 * * struct.$super - instance of SuperStruct
 * * struct... - see other methods in STRUCT_PUBLIC_MEMBERS
 */
export function proxifyStruct(struct) {
    const handler = {
        get(target, prop) {
            if (prop === SUPER_VALUE_PROP) {
                return struct;
            }
            else if (STRUCT_PUBLIC_MEMBERS.includes(prop)) {
                // public super struct prop
                return struct[prop];
            }
            // else prop or object itself
            return struct.values[prop];
        },
        has(target, prop) {
            if (prop === SUPER_VALUE_PROP || STRUCT_PUBLIC_MEMBERS.includes(prop)) {
                return true;
            }
            return struct.ownKeys.includes(prop);
        },
        set(target, prop, newValue) {
            return struct.setOwnValue(prop, newValue);
        },
        deleteProperty() {
            throw new Error(`It isn't possible to delete struct value`);
        },
        ownKeys() {
            return struct.ownKeys;
        },
    };
    return new Proxy(struct.values, handler);
}
export class SuperStruct extends SuperValueBase {
    isStruct = true;
    // current values
    values = {};
    proxyFn = proxifyStruct;
    // It assumes that you will not change it after initialization
    definition = {};
    get ownKeys() {
        return Object.keys(this.values);
    }
    constructor(definition, defaultRo = false) {
        super();
        for (const keyStr of Object.keys(definition)) {
            checkDefinition(definition[keyStr]);
            this.definition[keyStr] = prepareDefinitionItem(definition[keyStr], defaultRo);
        }
    }
    /**
     * Init with initial values.
     * It returns setter for readonly params
     */
    init = (initialValues) => {
        if (this.inited) {
            throw new Error(`The struct has been already initialized`);
        }
        this.events.emit(SUPER_VALUE_EVENTS.initStart);
        // set initial values
        for (const keyStr of Object.keys(this.definition)) {
            const keyName = keyStr;
            this.values[keyName] = this.resolveChildValue(this.definition[keyName], keyStr, initialValues?.[keyName]);
        }
        return super.init();
    };
    destroy = () => {
        super.destroy();
        for (const key of this.ownKeys) {
            const keyName = key;
            if (typeof this.values[keyName] === 'object' && this.values[keyName].destroy) {
                // it will destroy itself and its children
                this.values[keyName].destroy();
            }
        }
    };
    isKeyReadonly(key) {
        if (!this.definition[key]) {
            throw new Error(`Struct doesn't have key ${key}`);
        }
        return Boolean(this.definition?.[key].readonly);
    }
    getOwnValue(key) {
        if (!this.isInitialized)
            throw new Error(`Init it first`);
        return this.values[key];
    }
    setOwnValue(keyStr, value, ignoreRo = false) {
        const name = keyStr;
        this.validateItem(name, value, ignoreRo);
        this.values[name] = this.resolveChildValue(this.definition[name], keyStr, value);
        this.emitChildChangeEvent(keyStr);
        return true;
    }
    // TODO: наверное в default запретить пока super value
    /**
     * Set default value or null if the key doesn't have a default value
     * @param key
     */
    toDefaultValue = (key) => {
        if (!this.isInitialized)
            throw new Error(`Init it first`);
        else if (!this.definition[key]) {
            throw new Error(`Struct doesn't have key ${key}`);
        }
        let defaultValue = this.definition[key].default;
        // TODO: а если super type??? То надо вызвать default value у него ???
        //       или ничего не делать? Если менять заного то надо дестроить предыдущий
        // if no default value then make it from type
        if (Object.keys(SIMPLE_TYPES).includes(this.definition[key].type)
            && typeof defaultValue === 'undefined') {
            defaultValue = resolveInitialSimpleValue(this.definition[key].type, this.definition[key].nullable);
        }
        this.setOwnValue(key, defaultValue);
    };
    getProxy() {
        return super.getProxy();
    }
    /////// Struct specific
    // TODO: test
    batchSet(values) {
        if (!values)
            return;
        for (const key of Object.keys(values)) {
            this.setOwnValue(key, values[key]);
        }
    }
    // TODO: test
    validateItem(name, value, ignoreRo) {
        const keyStr = name;
        const definition = this.definition[name];
        checkValueBeforeSet(this.isInitialized, definition, keyStr, value, ignoreRo);
        validateChildValue(definition, name, value);
    }
    getDefinition(keyStr) {
        const key = keyStr;
        return this.definition[key];
    }
    /**
     * Set value of self readonly value and rise an event
     */
    myRoSetter = (name, newValue) => {
        this.setOwnValue(name, newValue, true);
    };
}
