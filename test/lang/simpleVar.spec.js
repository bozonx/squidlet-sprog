import {newScope} from "../../src/index.js";
import {deleteVar, newVar} from "../../src/lang/simpleVar.js";


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
    assert.deepEqual(scope.$super.values, {v1: 5})
    // delete var
    await scope.$run({
      $exp: 'deleteVar',
      name: 'v1',
    })
    assert.isUndefined(scope['v1'])
    assert.deepEqual(scope.$super.values, {})
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

  it('newVar: no definition', async () => {
    const scope = newScope()
    const def = {
      $exp: 'newVar',
      name: 'v1',
      value: 6,
    }

    await scope.$run(def)

    assert.equal(scope['v1'], 6)
  })

  // TODO: переопределение переменной - ошибка
  // TODO: без definition
  // TODO: переход переменных и определений в новый scope

})
