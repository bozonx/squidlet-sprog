import {newScope, proxyArray, SuperArray} from "../../src/index.js";


describe('SuperArray', () => {
  it('proxy', () => {
    const scope = newScope()
    const item = {
      type: 'number'
    }
    const arr = new SuperArray(scope, item)
    const proxyfied = proxyArray(arr)

    proxyfied.setValue(0, 5)

    assert.equal(proxyfied[0], 5)
  })

  // it('SuperArray', () => {
  //   const arr = new SuperArray()
  // })
})
