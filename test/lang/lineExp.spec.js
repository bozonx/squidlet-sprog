import {lineExp} from "../../src/lang/lineExp.js";
import {newScope} from "../../src/index.js";
import {EXPR_SIGNS} from "../../src/lib/lineExpressions.js";


// TODO: test Math.
// TODO: test toNumber, toString, toBoolean
// TODO: test deep


describe('lineExp', () => {
  it.only('simple values', async () => {
    const scope = newScope()

    assert.equal(await scope.$run({
      $exp: 'lineExp',
      items: [
        {$exp: 'newValue', value: 1},
        EXPR_SIGNS['+'],
        {$exp: 'newValue', value: 2},
      ]
    }), 3)
  })

  it.only('deep exp', async () => {
    const scope = newScope()

    assert.equal(await scope.$run({
      $exp: 'lineExp',
      items: [
        {$exp: 'newValue', value: {$exp: 'newValue', value: 2}},
        EXPR_SIGNS['*'],
        {$exp: 'newValue', value: 3},
      ]
    }), 6)
  })

  it.only('return an array', async () => {
    const scope = newScope()

    assert.deepEqual(await scope.$run({
      $exp: 'lineExp',
      items: [
        {$exp: 'newValue', value: [{$exp: 'newValue', value: 2}]},
      ]
    }), [2])
  })

})
