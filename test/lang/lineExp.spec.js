

// TODO: test Math.
// TODO: test toNumber, toString, toBoolean


import {lineExp} from "../../src/lang/lineExp.js";
import {newScope} from "../../src/index.js";
import {EXPR_SIGNS} from "../../src/lib/lineExpressions.js";

describe('lineExp', () => {
  it.only('common', async () => {
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
})
