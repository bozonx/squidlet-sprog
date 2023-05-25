import {newScope, proxyArray, SuperArray} from "../../src/index.js";


describe('SuperArray', () => {
  it('proxy', () => {
    const scope = newScope()
    const item = {
      type: 'number'
    }
    const arr = new SuperArray(scope, item)
    const proxyfied = arr.makeProxy()

    proxyfied.setValue('[0]', 5)

    assert.equal(proxyfied[0], 5)

    proxyfied[1] = 6

    assert.equal(proxyfied[1], 6)
    assert.deepEqual(proxyfied, [5,6])

    proxyfied.push(7)

    assert.equal(proxyfied[2], 7)
    assert.deepEqual(proxyfied, [5, 6, 7])
  })

  // it('SuperArray', () => {
  //   const arr = new SuperArray()
  // })
})
