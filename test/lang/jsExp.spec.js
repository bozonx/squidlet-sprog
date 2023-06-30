import {omitObj} from "squidlet-lib";
import {newScope} from "../../src/index.js";
import {jsExp} from "../../src/lang/jsExp.js";


describe('jsExp', () => {
  it.only('common', async () => {
    const scope = newScope({v1: 1})

    const res = await scope.$run({
      $exp: 'jsExp',
      exp: 'return v1',
    })

    assert.equal(res, 1)
  })

  it('return value', async () => {
    const scope = newScope({v1: 1})

    const res = await scope.$run({
      $exp: 'jsExp',
      exp: 'return scope.v1',
    })

    assert.equal(res, 1)
  })

  it('change value in scope', async () => {
    const scope = newScope({v1: 1})

    await scope.$run({
      $exp: 'jsExp',
      exp: 'scope.v1 = 5',
    })

    assert.deepEqual(omitObj(scope, 'std'), {v1: 5})
  })

})
