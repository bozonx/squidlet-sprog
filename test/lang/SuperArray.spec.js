import {newScope, SUPER_ARRAY_EVENTS, SuperArray} from "../../src/index.js";


describe('SuperArray', () => {
  it('proxy', async () => {
    const scope = newScope()
    const def = {
      $exp: 'newSuperArray',
      definition: {
        type: 'number'
      },
    }
    const proxyfied = await scope.$run(def)

    proxyfied.$super.init()

    proxyfied.setValue('[0]', 5)

    assert.equal(proxyfied[0], 5)

    proxyfied[1] = 6

    assert.equal(proxyfied[1], 6)
    assert.deepEqual(proxyfied, [5,6])

    proxyfied.push(7)

    assert.equal(proxyfied[2], 7)
    assert.deepEqual(proxyfied, [5, 6, 7])

    // spread
    assert.deepEqual([...proxyfied], [5, 6, 7])

    // for of
    const checkArr = []
    for (const item of proxyfied) checkArr.push(item)
    assert.deepEqual(checkArr, [5, 6, 7])

    // for in
    const checkArr2 = []
    for (const index in proxyfied) checkArr2.push(proxyfied[index])
    assert.deepEqual(checkArr2, [5, 6, 7])
  })

  it('you have to initialize array first', async () => {
    const scope = newScope()
    const def = {
      $exp: 'newSuperArray',
      definition: {
        type: 'number',
        defaultArray: [5]
      },
    }
    const arr = await scope.$run(def)
    // from base class
    assert.throws(() => arr.hasKey('p1'))
    assert.throws(() => arr.getValue('p1'))
    assert.throws(() => arr.setValue('p1', 6))
    assert.throws(() => arr.setNull('p1'))
    assert.throws(() => arr.clone())
    // from array class
    assert.throws(() => arr.getOwnValue(0))
    assert.throws(() => arr.setOwnValue(0, 6))
    assert.throws(() => arr.toDefaultValue(0))
    // array specific
    assert.throws(() => arr.clearIndex(0))
    assert.throws(() => arr.deleteIndex(0))
    assert.throws(() => arr.push(1))
    assert.throws(() => arr.pop())
    assert.throws(() => arr.shift())
    assert.throws(() => arr.unshift(1))
    assert.throws(() => arr.fill(1))
    assert.throws(() => arr.splice(1))
    assert.throws(() => arr.reverse())
    assert.throws(() => arr.sort(() => null))
  })

  it('check definition', async () => {
    const scope = newScope()
    const def = {
      $exp: 'newSuperArray',
      definition: {
        type: 'number',
        default: 4,
        defaultArray: [5]
      },
    }
    const arr = await scope.$run(def)

    arr.$super.init()

    assert.deepEqual(arr, [5])
    assert.deepEqual(arr.$super.definition, {
      "default": 4,
      "defaultArray": [ 5],
      "nullable": false,
      "readonly": false,
      "type": "number",
    })
  })

  it('priority of initial value', async () => {
    const scope = newScope()
    const spy = sinon.spy()
    const def = {
      $exp: 'newSuperArray',
      definition: {
        type: 'number',
        default: 4,
        defaultArray: [5]
      },
    }
    const arr = await scope.$run(def)

    arr.subscribe(spy)
    arr.$super.init([6])

    assert.deepEqual(arr, [6])
    spy.should.have.been.calledOnce
    spy.should.have.been.calledWith(arr.$super, undefined)
  })

  it('wrong default value', async () => {
    const scope = newScope()
    const def = {
      $exp: 'newSuperArray',
      definition: {
        type: 'number',
        default: 's',
      },
    }

    let arr

    try {
      arr = await scope.$run(def)
    }
    catch (e) {
    }

    if (arr) assert.fail('Shouldn\'t be ok')
  })

  it('wrong initial value', async () => {
    const scope = newScope()
    const spy = sinon.spy()
    const def = {
      $exp: 'newSuperArray',
      definition: {
        type: 'number',
      },
    }
    const arr = await scope.$run(def)

    arr.subscribe(spy)

    assert.throws(() => arr.$super.init(['s']))
    spy.should.have.not.been.called
  })

  it('readonly - via intial and setter', async () => {
    const scope = newScope()
    const spy = sinon.spy()
    const def = {
      $exp: 'newSuperArray',
      definition: {
        type: 'number',
        readonly: true,
      },
    }
    const arr = await scope.$run(def)

    arr.subscribe(spy)

    const setter = arr
      .$super.init([5])

    assert.isTrue(arr.$super.isKeyReadonly(0))
    spy.should.have.been.calledOnce

    assert.deepEqual(arr, [5])

    setter(0, 6)

    assert.deepEqual(arr, [6])
    // try to set by usual way
    assert.throws(() => arr.setValue(0, 7))
    // first time on init and the second time using setter
    spy.should.have.been.calledTwice
  })

  it('toDefaultValue - to default', async () => {
    const scope = newScope()
    const spy = sinon.spy()
    const def = {
      $exp: 'newSuperArray',
      definition: {
        type: 'number',
        default: 5
      },
    }
    const arr = await scope.$run(def)

    arr.subscribe(spy)

    arr.$super.init([6])

    assert.deepEqual(arr, [6])
    arr.$super.toDefaultValue(0)
    assert.deepEqual(arr, [5])
    spy.should.have.been.calledTwice
  })

  it('toDefaultValue - to type\'s initial', async () => {
    const scope = newScope()
    const spy = sinon.spy()
    const def = {
      $exp: 'newSuperArray',
      definition: {
        type: 'number',
      },
    }
    const arr = await scope.$run(def)

    arr.subscribe(spy)

    arr.$super.init([6])

    assert.deepEqual(arr, [6])
    arr.$super.toDefaultValue(0)
    assert.deepEqual(arr, [0])
    spy.should.have.been.calledTwice
  })

  it(`clearIndex`, async () => {
    const scope = newScope()
    const spy = sinon.spy()
    const def = {
      $exp: 'newSuperArray',
      definition: {
        type: 'string',
      },
    }
    const arr = await scope.$run(def)

    arr.subscribe(spy)
    arr.$super.init(['a', 'b'])

    arr.$super.clearIndex(0)
    assert.deepEqual(arr, [undefined, 'b'])
    spy.should.have.been.calledTwice
  })

  it(`clearValue`, async () => {
    const scope = newScope()
    const spy = sinon.spy()
    const def = {
      $exp: 'newSuperArray',
      definition: {
        type: 'string',
      },
    }
    const arr = await scope.$run(def)

    arr.subscribe(spy)
    arr.$super.init(['a', 'b'])

    arr.$super.clearValue('a')
    assert.deepEqual(arr, [undefined, 'b'])
    spy.should.have.been.calledTwice
  })

  it(`deleteIndex`, async () => {
    const scope = newScope()
    const spy = sinon.spy()
    const def = {
      $exp: 'newSuperArray',
      definition: {
        type: 'string',
      },
    }
    const arr = await scope.$run(def)

    arr.subscribe(spy)
    arr.$super.init(['a', 'b'])

    arr.$super.deleteIndex(0)
    assert.deepEqual(arr, ['b'])
    spy.should.have.been.calledTwice
  })

  it(`deleteValue`, async () => {
    const scope = newScope()
    const spy = sinon.spy()
    const def = {
      $exp: 'newSuperArray',
      definition: {
        type: 'string',
      },
    }
    const arr = await scope.$run(def)

    arr.subscribe(spy)
    arr.$super.init(['a', 'b'])

    arr.$super.deleteValue('a')
    assert.deepEqual(arr, ['b'])
    spy.should.have.been.calledTwice
  })

  it('little methods', async () => {
    const scope = newScope()
    const spy = sinon.spy()
    const def = {
      $exp: 'newSuperArray',
      definition: {
        type: 'number',
        nullable: true
      },
    }
    const arr = await scope.$run(def)

    arr.subscribe(spy)
    arr.$super.init()

    assert.isFalse(arr.$super.isKeyReadonly(0))

    arr.$super.setNull('[0]')
    assert.isNull(arr.getValue('[0]'))

    arr.$super.setOwnValue(0, 6)
    assert.equal(arr.$super.getOwnValue(0), 6)

    assert.isTrue(arr.$super.hasKey('[0]'))
    assert.isFalse(arr.$super.hasKey('[1]'))

    arr.$super.setValue('[2]', 2)
    assert.deepEqual(arr.$super.allKeys, [0, undefined, 2])
  })

  it('execute expressions', async () => {
    const scope = newScope()
    const spy = sinon.spy()
    const def = {
      $exp: 'newSuperArray',
      definition: {
        type: 'number',
      },
    }
    const arr = await scope.$run(def)

    arr.subscribe(spy)
    arr.$super.init()

    await arr.$super.execute(newScope({scopeVal: 2}), [
      {
        $exp: 'getValue',
        path: 'scopeVal',
      }
    ])

    assert.equal(arr.getValue('[0]'), 2)
    spy.should.have.been.calledTwice
  })

  it('execute deep obj expressions', async () => {
    const scope = newScope()
    const spy = sinon.spy()
    const def = {
      $exp: 'newSuperArray',
      definition: {
        type: 'object',
      },
    }
    const arr = await scope.$run(def)

    arr.subscribe(spy)
    arr.$super.init()

    await arr.$super.execute(newScope({scopeVal: 2}), [
      {
        a: {
          $exp: 'getValue',
          path: 'scopeVal',
        }
      }
    ])

    assert.deepEqual(arr.getValue('[0]'), {a: 2})
    spy.should.have.been.calledTwice
  })

  it('execute deep arr expressions', async () => {
    const scope = newScope()
    const spy = sinon.spy()
    const def = {
      $exp: 'newSuperArray',
      definition: {
        type: 'array',
      },
    }
    const arr = await scope.$run(def)

    arr.subscribe(spy)
    arr.$super.init()

    await arr.$super.execute(newScope({scopeVal: 2}), [
      [
        {
          $exp: 'getValue',
          path: 'scopeVal',
        }
      ]
    ])

    assert.deepEqual(arr.getValue('[0]'), [2])
    spy.should.have.been.calledTwice
  })

  // Mutable array standard methods

  it('push', async () => {
    const scope = newScope()
    const spyChange = sinon.spy()
    const spyAdded = sinon.spy()
    const arr = await scope.$run({
      $exp: 'newSuperArray',
      definition: {
        type: 'number',
        defaultArray: [4]
      },
    })

    arr.subscribe(spyChange)
    arr.$super.events.addListener(SUPER_ARRAY_EVENTS.added, spyAdded)
    arr.$super.init()

    arr.push(5,6)

    assert.deepEqual(arr.$super.values, [4, 5,6])

    spyChange.should.have.been.calledTwice
    spyAdded.should.have.been.calledOnce
    spyAdded.should.have.been.calledWith(arr.$super, undefined, [5,6], [1,2])
  })

  it('push - not supported value', async () => {
    const scope = newScope()
    const arr = await scope.$run({
      $exp: 'newSuperArray',
      definition: {
        type: 'number',
      },
    })

    arr.$super.init()

    assert.throws(() => arr.push('5'))
  })

  it('pop', async () => {
    const scope = newScope()
    const spyChange = sinon.spy()
    const spyRemoved = sinon.spy()
    const arr = await scope.$run({
      $exp: 'newSuperArray',
      definition: {
        type: 'number',
        defaultArray: [5,6]
      },
    })

    arr.subscribe(spyChange)
    arr.$super.events.addListener(SUPER_ARRAY_EVENTS.removed, spyRemoved)
    arr.$super.init()

    assert.deepEqual(arr.$super.values, [5,6])

    arr.pop()

    assert.deepEqual(arr.$super.values, [5])

    spyChange.should.have.been.calledTwice
    spyRemoved.should.have.been.calledOnce
    spyRemoved.should.have.been.calledWith(arr.$super, undefined, [6], [1])
  })

  it('shift', async () => {
    const scope = newScope()
    const spyChange = sinon.spy()
    const spyRemoved = sinon.spy()
    const arr = await scope.$run({
      $exp: 'newSuperArray',
      definition: {
        type: 'number',
        defaultArray: [5,6]
      },
    })

    arr.subscribe(spyChange)
    arr.$super.events.addListener(SUPER_ARRAY_EVENTS.removed, spyRemoved)
    arr.$super.init()

    assert.deepEqual(arr.$super.values, [5,6])

    arr.shift()

    assert.deepEqual(arr.$super.values, [6])

    spyChange.should.have.been.calledTwice
    spyRemoved.should.have.been.calledOnce
    spyRemoved.should.have.been.calledWith(arr.$super, undefined, [5], [0])
  })

  it('unshift', async () => {
    const scope = newScope()
    const spyChange = sinon.spy()
    const spyAdded = sinon.spy()
    const arr = await scope.$run({
      $exp: 'newSuperArray',
      definition: {
        type: 'number',
        defaultArray: [7]
      },
    })

    arr.subscribe(spyChange)
    arr.$super.events.addListener(SUPER_ARRAY_EVENTS.added, spyAdded)
    arr.$super.init()

    arr.unshift(5,6)

    assert.deepEqual(arr.$super.values, [5,6,7])

    spyChange.should.have.been.calledTwice
    spyAdded.should.have.been.calledOnce
    spyAdded.should.have.been.calledWith(arr.$super, undefined, [5,6], [0,1])
  })

  it('unshift - not supported value', async () => {
    const scope = newScope()
    const arr = await scope.$run({
      $exp: 'newSuperArray',
      definition: {
        type: 'number',
      },
    })

    arr.$super.init()

    assert.throws(() => arr.unshift('5'))
  })

  it('fill - full', async () => {
    const scope = newScope()
    const spyChange = sinon.spy()
    const arr = await scope.$run({
      $exp: 'newSuperArray',
      definition: {
        type: 'number',
        defaultArray: [0,1]
      },
    })

    arr.subscribe(spyChange)
    arr.$super.init()

    arr.fill(5)

    assert.deepEqual(arr.$super.values, [5,5])

    spyChange.should.have.been.callCount(4)
  })

  it('fill - start', async () => {
    const scope = newScope()
    const spyChange = sinon.spy()
    const arr = await scope.$run({
      $exp: 'newSuperArray',
      definition: {
        type: 'number',
        defaultArray: [0,1,2]
      },
    })

    arr.subscribe(spyChange)
    arr.$super.init()

    arr.fill(5, 1)

    assert.deepEqual(arr.$super.values, [0,5,5])

    spyChange.should.have.been.callCount(4)
  })

  it('fill - end less then length', async () => {
    const scope = newScope()
    const spyChange = sinon.spy()
    const arr = await scope.$run({
      $exp: 'newSuperArray',
      definition: {
        type: 'number',
        defaultArray: [0,1,2,4]
      },
    })

    arr.subscribe(spyChange)
    arr.$super.init()

    arr.fill(5, 1, 3)

    assert.deepEqual(arr.$super.values, [0,5,5,4])

    spyChange.should.have.been.callCount(4)
  })

  it.only(`fill - end is bigger then length - it shouldn't work`, async () => {
    const scope = newScope()
    const spyChange = sinon.spy()
    const arr = await scope.$run({
      $exp: 'newSuperArray',
      definition: {
        type: 'number',
        defaultArray: [0,1]
      },
    })

    arr.subscribe(spyChange)
    arr.$super.init()

    arr.fill(5, 1, 3)

    assert.deepEqual(arr.$super.values, [0,5])

    spyChange.should.have.been.calledThrice
  })

  it.only('splice', async () => {
    const scope = newScope()
    const spyChange = sinon.spy()
    const spyRemoved = sinon.spy()
    const arr = await scope.$run({
      $exp: 'newSuperArray',
      definition: {
        type: 'number',
        defaultArray: [5,6]
      },
    })

    arr.subscribe(spyChange)
    arr.$super.events.addListener(SUPER_ARRAY_EVENTS.removed, spyRemoved)
    arr.$super.init()

    assert.deepEqual(arr.$super.values, [5,6])

    arr.splice()

    assert.deepEqual(arr.$super.values, [6])

    spyChange.should.have.been.calledTwice
    spyRemoved.should.have.been.calledOnce
    spyRemoved.should.have.been.calledWith(arr.$super, undefined, [5], [0])
  })

  // TODO: test move
  // TODO: test reverse
  // TODO: test sort
  // TODO: test onArrayChange()

  // TODO: children - simple objects and array - check deepness and changes of them
  // TODO: обычная ф-я ???
  // TODO: инстанс класса ???

  // TODO: link
  // TODO: unlink

})
