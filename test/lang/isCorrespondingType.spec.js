import {isCorrespondingType} from "../../src/lib/isCorrespondingType.js";
import {newScope, SuperArray, SuperData, SuperFunc, SuperStruct} from "../../src/index.js";


describe('isCorrespondingType', () => {
  it('only value - do not check', async () => {
    assert.isTrue(isCorrespondingType(5))
    assert.isTrue(isCorrespondingType('a'))
  })

  it('nullable', async () => {
    assert.isTrue(isCorrespondingType(5, undefined, true))
    assert.isTrue(isCorrespondingType(null, undefined, true))
    assert.isTrue(isCorrespondingType(null, 'string', true))
    assert.isFalse(isCorrespondingType(null, undefined, false))
    assert.isTrue(isCorrespondingType(undefined, undefined, false))
    assert.isTrue(isCorrespondingType(undefined, undefined, true))
  })

  it('check type', async () => {
    // number
    assert.isTrue(isCorrespondingType(5, 'number'))
    assert.isFalse(isCorrespondingType('5', 'number'))
    // string
    assert.isFalse(isCorrespondingType(5, 'string'))
    assert.isTrue(isCorrespondingType('5', 'string'))
    // boolean
    assert.isTrue(isCorrespondingType(false, 'boolean'))
    assert.isFalse(isCorrespondingType('false', 'boolean'))
    // any
    assert.isTrue(isCorrespondingType(false, 'any'))
    assert.isTrue(isCorrespondingType(5, 'any'))
    assert.isTrue(isCorrespondingType('5', 'any'))
    // null
    assert.isTrue(isCorrespondingType(null, 'null'))
    assert.isTrue(isCorrespondingType(null, 'null', true))
    assert.isTrue(isCorrespondingType(null, 'null', false))
    assert.isFalse(isCorrespondingType(false, 'null'))
    assert.isFalse(isCorrespondingType(false, 'null', true))
    assert.isFalse(isCorrespondingType(false, 'null', false))
    // array
    assert.isTrue(isCorrespondingType([], 'array'))
    assert.isFalse(isCorrespondingType('', 'array'))
    assert.isFalse(isCorrespondingType({}, 'array'))
    // object
    assert.isTrue(isCorrespondingType({}, 'object'))
    class a {}
    assert.isTrue(isCorrespondingType(new a(), 'object'))
    assert.isFalse(isCorrespondingType([], 'object'))
    // function
    function f () {}
    assert.isTrue(isCorrespondingType(f, 'function'))
    async function f2() {}
    assert.isTrue(isCorrespondingType(f2, 'function'))
    assert.isFalse(isCorrespondingType({}, 'function'))
    // Promise
    assert.isTrue(isCorrespondingType(Promise.resolve(), 'Promise'))
    assert.isTrue(isCorrespondingType(Promise.reject('a'), 'Promise'))
    assert.isFalse(isCorrespondingType({}, 'Promise'))
    // SuperData
    const sd = new SuperData()
    assert.isTrue(isCorrespondingType(sd, 'SuperData'))
    assert.isFalse(isCorrespondingType({}, 'SuperData'))
    // SuperStruct
    const ss = new SuperStruct({})
    assert.isTrue(isCorrespondingType(ss, 'SuperStruct'))
    assert.isFalse(isCorrespondingType({}, 'SuperStruct'))
    assert.isFalse(isCorrespondingType(sd, 'SuperStruct'))
    // SuperArray
    const sa = new SuperArray({})
    assert.isTrue(isCorrespondingType(sa, 'SuperArray'))
    assert.isFalse(isCorrespondingType({}, 'SuperArray'))
    assert.isFalse(isCorrespondingType(sd, 'SuperArray'))
    assert.isFalse(isCorrespondingType(ss, 'SuperArray'))
    // SuperFunc
    const sf = new SuperFunc(newScope(), {}, [])
    assert.isTrue(isCorrespondingType(sf, 'SuperFunc'))
    assert.isFalse(isCorrespondingType({}, 'SuperFunc'))
    assert.isFalse(isCorrespondingType(sd, 'SuperFunc'))
    assert.isFalse(isCorrespondingType(sd, 'SuperFunc'))
    assert.isFalse(isCorrespondingType(sa, 'SuperFunc'))
  })

})
