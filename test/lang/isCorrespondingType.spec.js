import {isCorrespondingType} from "../../src/lib/isCorrespondingType.js";
import {newScope, SuperArray, SuperData, SuperFunc, SuperStruct} from "../../src/index.js";


describe('isCorrespondingType', () => {
  it('only value - do not check', async () => {
    assert.isTrue(isCorrespondingType(5))
    assert.isTrue(isCorrespondingType('a'))
    assert.isTrue(isCorrespondingType(undefined))
    assert.isTrue(isCorrespondingType(null))
  })

  it('nullable', async () => {
    assert.isTrue(isCorrespondingType(5, undefined, true))
    assert.isTrue(isCorrespondingType(null, undefined, true))
    assert.isTrue(isCorrespondingType(null, 'string', true))
    assert.isTrue(isCorrespondingType(undefined, undefined, false))
    assert.isTrue(isCorrespondingType(undefined, undefined, true))
    assert.isTrue(isCorrespondingType(null, ['null', 'number']), true)
    // this is because undefined type = any
    assert.isTrue(isCorrespondingType(null, undefined, false))
    assert.isTrue(isCorrespondingType(null, 'any', false))
    assert.isTrue(isCorrespondingType(null, ['any'], false))
    assert.isTrue(isCorrespondingType(null, [], false))
    // null
    assert.isTrue(isCorrespondingType(null, 'null'))
    assert.isTrue(isCorrespondingType(null, 'null', true))
    assert.isTrue(isCorrespondingType(null, 'null', false))
    assert.isFalse(isCorrespondingType(false, 'null'))
    assert.isFalse(isCorrespondingType(false, 'null', true))
    assert.isFalse(isCorrespondingType(false, 'null', false))
  })

  it('any', async () => {
    assert.isTrue(isCorrespondingType(false, 'any'))
    assert.isTrue(isCorrespondingType(5, 'any'))
    assert.isTrue(isCorrespondingType('5', 'any'))
  })

  it('check simple type', async () => {
    // string
    assert.isTrue(isCorrespondingType('5', 'string'))
    assert.isTrue(isCorrespondingType('5', ['string', 'boolean']))
    assert.isFalse(isCorrespondingType(5, 'string'))
    assert.isFalse(isCorrespondingType(5, ['boolean', 'string']))
    // number
    assert.isTrue(isCorrespondingType(5, 'number'))
    assert.isTrue(isCorrespondingType(5, ['number']))
    assert.isTrue(isCorrespondingType(5, ['null', 'number']))
    assert.isFalse(isCorrespondingType('5', 'number'))
    assert.isFalse(isCorrespondingType('5', ['number']))
    assert.isFalse(isCorrespondingType('5', ['boolean', 'number']))
    // boolean
    assert.isTrue(isCorrespondingType(false, 'boolean'))
    assert.isTrue(isCorrespondingType(false, ['number', 'boolean']))
    assert.isFalse(isCorrespondingType('false', 'boolean'))
    assert.isFalse(isCorrespondingType('false', ['number', 'boolean']))
    // function
    function f () {}
    assert.isTrue(isCorrespondingType(f, 'function'))
    async function f2() {}
    assert.isTrue(isCorrespondingType(f2, 'function'))
    assert.isFalse(isCorrespondingType({}, 'function'))
    // simple array
    assert.isTrue(isCorrespondingType([], 'array'))
    assert.isTrue(isCorrespondingType([], ['object', 'array']))
    assert.isFalse(isCorrespondingType([], ['object']))
    assert.isFalse(isCorrespondingType('', 'array'))
    assert.isFalse(isCorrespondingType('', ['array', 'object']))
    assert.isFalse(isCorrespondingType({}, 'array'))
    assert.isFalse(isCorrespondingType({}, ['array', 'string']))
    // plain object
    assert.isTrue(isCorrespondingType({}, 'plainObject'))
    assert.isTrue(isCorrespondingType({}, ['plainObject', 'string']))
    assert.isFalse(isCorrespondingType({}, 'array'))
    assert.isFalse(isCorrespondingType({}, ['array', 'string']))
    assert.isFalse(isCorrespondingType([], 'plainObject'))
    assert.isFalse(isCorrespondingType([], ['plainObject']))
    class po {}
    assert.isFalse(isCorrespondingType(new po(), 'plainObject'))
    assert.isFalse(isCorrespondingType(new po(), 'array'))
    assert.isFalse(isCorrespondingType(new po(), ['string', 'plainObject']))
    assert.isFalse(isCorrespondingType(new po(), ['array']))
    // any object
    assert.isTrue(isCorrespondingType({}, 'object'))
    assert.isTrue(isCorrespondingType({}, ['object', 'string']))
    assert.isFalse(isCorrespondingType({}, 'array'))
    assert.isFalse(isCorrespondingType({}, ['array', 'string']))
    assert.isFalse(isCorrespondingType([], 'object'))
    assert.isFalse(isCorrespondingType([], ['object']))
    class a {}
    assert.isTrue(isCorrespondingType(new a(), 'object'))
    assert.isFalse(isCorrespondingType(new a(), 'array'))
    assert.isTrue(isCorrespondingType(new a(), ['string', 'object']))
    assert.isFalse(isCorrespondingType(new a(), ['array']))
    // Promise
    assert.isTrue(isCorrespondingType(Promise.resolve(), 'Promise'))
    assert.isTrue(isCorrespondingType(Promise.resolve(), ['null', 'Promise']))
    assert.isTrue(isCorrespondingType(Promise.reject('a'), 'Promise'))
    assert.isTrue(isCorrespondingType(Promise.reject('a'), ['Promise']))
    assert.isFalse(isCorrespondingType({}, 'Promise'))
    assert.isFalse(isCorrespondingType({}, ['Promise', 'array']))
  })

  it('check super types', async () => {
    // SuperData
    const sd = new SuperData().getProxy()
    assert.isTrue(isCorrespondingType(sd, 'SuperData'))
    assert.isTrue(isCorrespondingType(sd, ['SuperData']))
    assert.isFalse(isCorrespondingType({}, 'SuperData'))
    assert.isFalse(isCorrespondingType({}, ['SuperData', 'SuperStruct']))
    // SuperStruct
    const ss = new SuperStruct({a: {type: 'any'}}).getProxy()
    assert.isTrue(isCorrespondingType(ss, 'SuperStruct'))
    assert.isTrue(isCorrespondingType(ss, ['SuperStruct']))
    assert.isFalse(isCorrespondingType({}, 'SuperStruct'))
    assert.isFalse(isCorrespondingType(sd, 'SuperStruct'))
    // SuperArray
    const sa = new SuperArray().getProxy()
    assert.isTrue(isCorrespondingType(sa, 'SuperArray'))
    assert.isTrue(isCorrespondingType(sa, ['SuperArray']))
    assert.isFalse(isCorrespondingType({}, 'SuperArray'))
    assert.isFalse(isCorrespondingType(sd, 'SuperArray'))
    assert.isFalse(isCorrespondingType(ss, 'SuperArray'))
    // SuperFunc
    const sf = new SuperFunc(newScope(), {}, []).getProxy()
    assert.isTrue(isCorrespondingType(sf, 'SuperFunc'))
    assert.isTrue(isCorrespondingType(sf, ['SuperFunc']))
    assert.isFalse(isCorrespondingType({}, 'SuperFunc'))
    assert.isFalse(isCorrespondingType(sd, 'SuperFunc'))
    assert.isFalse(isCorrespondingType(ss, 'SuperFunc'))
    assert.isFalse(isCorrespondingType(sa, 'SuperFunc'))
  })

  it('custom types', async () => {
    class Abc {}
    assert.isTrue(isCorrespondingType(new Abc(), 'Abc'))
    assert.isTrue(isCorrespondingType(new Abc(), ['SuperFunc', 'Abc']))
    assert.isFalse(isCorrespondingType(new Abc(), 'Abcd'))
    assert.isFalse(isCorrespondingType(new Abc(), ['Abcd', 'SuperFunc']))
  })

})
