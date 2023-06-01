import {newScope, SuperArray} from "../../src/index.js";


// TODO: test toDefaultValue что установиться undefined если нет значения по умолчанию


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
    assert.throws(() => arr.myKeys())
    assert.throws(() => arr.getOwnValue(0))
    assert.throws(() => arr.setOwnValue(0, 6))
    assert.throws(() => arr.toDefaultValue(0))
    // array specific
    assert.throws(() => arr.clearItem(0))
    assert.throws(() => arr.deleteItem(0))
    assert.throws(() => arr.push(1))
    assert.throws(() => arr.pop())
    assert.throws(() => arr.shift())
    assert.throws(() => arr.unshift(1))
    assert.throws(() => arr.fill(1))
    assert.throws(() => arr.splice(1))
    assert.throws(() => arr.reverse())
    assert.throws(() => arr.sort(() => null))
  })
})
