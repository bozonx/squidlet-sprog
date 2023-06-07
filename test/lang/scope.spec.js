import {newScope} from "../../src/index.js";
import {deleteVar, newVar} from "../../src/lang/simpleVar.js";


describe('scope', () => {
  it('inherit scope with definitions', async () => {
    const scope1 = newScope({v0: 0})
    const spy = sinon.spy()

    await scope1.$run({
      $exp: 'newVar',
      name: 'v1',
      definition: {
        type: 'number',
        default: 1,
      }
    })

    const scope2 = newScope({v3: 3}, scope1)

    await scope2.$run({
      $exp: 'newVar',
      name: 'v2',
      value: 2,
    })

    assert.deepEqual(scope2.$super.clone(), {v0: 0, v1: 1, v2: 2, v3: 3})
    assert.deepEqual(scope2.$super.definition['v1'].type, 'number')
    // catch changes from scope2
    scope1.$super.subscribe(spy)
    scope2.$super.setOwnValue('v1', 8)
    spy.should.have.been.calledOnce
  })

  it('layers', async () => {
    const scope1 = newScope({v0: 0})
    const scope2 = newScope(undefined, scope1)

    await scope2.$run({
      $exp: 'newVar',
      name: 'v0',
      value: 1,
    })

    assert.deepEqual(scope1.$super.clone(), {v0: 0})
    assert.deepEqual(scope2.$super.clone(), {v0: 1})
  })


  // TODO: test deep with overwrite

})
