import {newScope} from "../../src/index.js";
import {deleteVar, newVar} from "../../src/lang/simpleVar.js";


describe('scope', () => {
  it('inherit scope', async () => {
    const scope1 = newScope()

    await scope1.$run({
      $exp: 'newVar',
      name: 'v1',
      value: 1,
    })

    const scope2 = newScope({}, scope1)

    await scope2.$run({
      $exp: 'newVar',
      name: 'v2',
      value: 2,
    })

    assert.deepEqual(scope2.$super.values, {v1: 1, v2: 2})
  })

  // TODO: переход определений в новый scope
  // TODO: начальные данные scope

})
