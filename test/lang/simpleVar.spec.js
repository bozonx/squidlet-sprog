import {newScope} from "../../src/index.js";


describe('simpleVar', () => {
  it('newVar and delete var', async () => {
    const scope = newScope()
    const def = {
      $exp: 'newVar',
      name: 'v1',
      definition: {
        type: 'number',
        default: 5,
        required: false,
        readonly: false,
        nullable: false,
      }
    }

    await scope.$run(def)

    assert.equal(scope['v1'], 5)
    assert.deepEqual(scope.$super.clone(), {v1: 5})
    // // delete var
    // await scope.$run({
    //   $exp: 'deleteVar',
    //   name: 'v1',
    // })
    // assert.isUndefined(scope['v1'])
    // assert.deepEqual(scope.$super.clone(), {})
    // assert.isUndefined(scope.$super.definition['v1'])
  })

  it('newVar with initial value', async () => {
    const scope = newScope()
    const def = {
      $exp: 'newVar',
      name: 'v1',
      value: 6,
      definition: {
        type: 'number',
        default: 5,
        required: false,
        readonly: false,
        nullable: false,
      }
    }

    await scope.$run(def)

    assert.equal(scope['v1'], 6)
  })

  it('no definition', async () => {
    const scope = newScope()
    const def = {
      $exp: 'newVar',
      name: 'v1',
      value: 6,
    }

    await scope.$run(def)

    assert.equal(scope['v1'], 6)
  })

  it('prohibit to redefine var', async () => {
    const scope = newScope()

    await scope.$run({
      $exp: 'newVar',
      name: 'v1',
      value: 6,
    })

    await assert.isPromiseRejected(scope.$run({
      $exp: 'newVar',
      name: 'v1',
      value: 8,
    }))
  })

})
