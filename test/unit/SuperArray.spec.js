import {newScope, SuperArray} from "../../src/index.js";


// TODO: test toDefaultValue что установиться undefined если нет значения по умолчанию


describe('SuperArray', () => {
  it('proxy', () => {

    // TODO: review

    const scope = newScope()
    const item = {
      type: 'number'
    }
    const arr = new SuperArray(scope, item)
    const proxyfied = arr.getProxy()

    proxyfied.$super.init()

    proxyfied.setValue('[0]', 5)

    assert.equal(proxyfied[0], 5)

    proxyfied[1] = 6

    assert.equal(proxyfied[1], 6)
    assert.deepEqual(proxyfied, [5,6])

    proxyfied.push(7)

    assert.equal(proxyfied[2], 7)
    assert.deepEqual(proxyfied, [5, 6, 7])

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

  // it('SuperArray', () => {
  //   const arr = new SuperArray()
  // })
})
