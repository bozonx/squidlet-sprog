import {newScope, SuperData} from "../../src/index.js";
import {SUPER_VALUE_EVENTS} from "../../src/lib/SuperValueBase.js";


describe('SuperData layers', () => {
  it('layers', async () => {
    const dataBottom = new SuperData()

    dataBottom.init({a: 1, b: 2})

    const dataTop = new SuperData(
      undefined,
      undefined,
      dataBottom
    )

    dataTop.init({a: 5, c: 3})

    assert.deepEqual(dataBottom.ownValues, {a: 1, b: 2})
    assert.deepEqual(dataTop.ownValues, {a: 5, c: 3})
    assert.deepEqual(dataBottom.ownKeys, ['a', 'b'])
    assert.deepEqual(dataTop.ownKeys, ['a', 'c'])
    assert.deepEqual(dataTop.allKeys, ['a', 'b', 'c'])
    assert.deepEqual(dataTop.clone(), {a: 5, b: 2, c: 3})
    assert.equal(dataBottom.getValue('a'), 1)
    assert.equal(dataTop.getValue('a'), 5)
    assert.equal(dataTop.getValue('b'), 2)
    // delete var always from both layers
    dataTop.forget('a')
    assert.deepEqual(dataBottom.ownKeys, ['b'])
    assert.deepEqual(dataTop.ownKeys, ['c'])
    assert.deepEqual(dataTop.allKeys, ['b', 'c'])
    // setValue
    dataTop.setValue('a', 7)
    assert.deepEqual(dataBottom.allKeys, ['b'])
    assert.deepEqual(dataTop.ownKeys, ['c', 'a'])
    assert.deepEqual(dataTop.allKeys, ['b', 'c', 'a'])
    assert.isUndefined(dataBottom.getValue('a'))
    assert.equal(dataTop.getValue('a'), 7)
    assert.isFalse(dataBottom.hasKey('a'))
    assert.isTrue(dataTop.hasKey('a'))
    // setOwnValue
    dataTop.setOwnValue('d', 1)
    assert.isUndefined(dataBottom.getValue('d'))
    assert.equal(dataTop.getValue('d'), 1)
    assert.isFalse(dataBottom.hasKey('d'))
    assert.isTrue(dataTop.hasKey('d'))
    // define
    dataBottom.define('e', {type: "number", default: 2})
    dataTop.define('e', {type: "string", default: 's'})
    assert.equal(dataBottom.getValue('e'), 2)
    assert.equal(dataTop.getValue('e'), 's')
    dataTop.setValue('e', 'a')
    assert.equal(dataBottom.getValue('e'), 2)
    assert.equal(dataTop.getValue('e'), 'a')
  })

  it('layers deep', async () => {
    const dataBottom = new SuperData()

    dataBottom.init({a: {aa: 1}})

    const dataTop = new SuperData(
      undefined,
      undefined,
      dataBottom
    )

    dataTop.init({a: {aa: 2}})

    assert.equal(dataBottom.getValue('a.aa'), 1)
    assert.equal(dataTop.getValue('a.aa'), 2)
    // update only top value
    dataTop.setValue('a.aa', 3)
    assert.equal(dataBottom.getValue('a.aa'), 1)
    assert.equal(dataTop.getValue('a.aa'), 3)
    // set another value to top
    dataTop.setValue('a.cc', 1)
    assert.isUndefined(dataBottom.getValue('a.cc'))
    assert.equal(dataTop.getValue('a.cc'), 1)
    assert.isFalse(dataBottom.hasKey('a.cc'))
    assert.isTrue(dataTop.hasKey('a.cc'))
  })

  it('get from bottom layer', async () => {
    const dataBottom = new SuperData()

    dataBottom.init({a: {}})

    const dataTop = new SuperData(
      undefined,
      undefined,
      dataBottom
    )

    dataTop.init()

    dataBottom.setValue('a.bb', 1)
    assert.equal(dataBottom.getValue('a.bb'), 1)
    assert.equal(dataTop.getValue('a.bb'), 1)
    assert.isTrue(dataBottom.hasKey('a.bb'))
    assert.isTrue(dataTop.hasKey('a.bb'))
    // it will not work because "a" have value {} which makes a new tree
    dataTop.setOwnValue('a', {})
    assert.equal(dataBottom.getValue('a.bb'), 1)
    assert.isUndefined(dataTop.getValue('a.bb'))
    assert.isTrue(dataBottom.hasKey('a.bb'))
    assert.isFalse(dataTop.hasKey('a.bb'))
  })

  it('set to bottom layer from top if value has not defined on top', async () => {
    const dataBottom = new SuperData()

    dataBottom.init({a: 1})

    const dataTop = new SuperData(
      undefined,
      undefined,
      dataBottom
    )

    dataTop.init()

    dataTop.setValue('a', 2)

    assert.equal(dataBottom.getValue('a'), 2)
    assert.equal(dataTop.getValue('a'), 2)
    assert.isUndefined(dataTop.getOwnValue('a'))
  })

  it('deep super value', async () => {
    const dataBottom = new SuperData()
    const deepValue = new SuperData()

    deepValue.init({d: 1})
    dataBottom.init({a: deepValue.getProxy()})

    const dataTop = new SuperData(
      undefined,
      undefined,
      dataBottom
    )

    dataTop.init()

    assert.equal(dataBottom.getValue('a.d'), 1)
    assert.equal(dataTop.getValue('a.d'), 1)
  })

  it('layers events whe set via top layer', async () => {
    const spy1 = sinon.spy()
    const spy2 = sinon.spy()
    const dataBottom = new SuperData()

    dataBottom.subscribe(spy1)
    dataBottom.init({a: 1})

    const dataTop = new SuperData(
      undefined,
      undefined,
      dataBottom
    )

    dataTop.subscribe(spy2)
    dataTop.init()

    dataTop.setValue('a', 2)

    assert.equal(dataBottom.getValue('a'), 2)
    assert.equal(dataTop.getValue('a'), 2)
    spy1.should.have.been.calledTwice
    // it have to rise an event too
    spy2.should.have.been.calledTwice
  })

  it('layers events whe set via bottom layer', async () => {
    const spy1 = sinon.spy()
    const spy2 = sinon.spy()
    const dataBottom = new SuperData()

    dataBottom.subscribe(spy1)
    dataBottom.init({a: 1})

    const dataTop = new SuperData(
      undefined,
      undefined,
      dataBottom
    )

    dataTop.subscribe(spy2)
    dataTop.init()

    dataBottom.setValue('a', 2)

    assert.equal(dataBottom.getValue('a'), 2)
    assert.equal(dataTop.getValue('a'), 2)
    spy1.should.have.been.calledTwice
    // it have to rise an event too
    spy2.should.have.been.calledTwice
  })

})
