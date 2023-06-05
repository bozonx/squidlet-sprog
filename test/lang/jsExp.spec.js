import {newScope} from "../../src/index.js";
import {jsExp} from "../../src/lang/jsExp.js";


describe('jsExp', () => {
  it.only('return value', async () => {
    const scope = newScope({v1: 1})

    const res = await scope.$run({
      $exp: 'jsExp',
      exp: 'return scope.v1',
    })

    assert.equal(res, 1)
  })

  it.only('change value in scope', async () => {
    const scope = newScope({v1: 1})

    await scope.$run({
      $exp: 'jsExp',
      exp: 'scope.v1 = 5',
    })

    assert.deepEqual(scope, {v1: 5})
  })

})
