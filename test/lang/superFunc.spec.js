import {newScope} from "../../src/index.js";
import {newSuperFunc} from "../../src/lang/superFunc.js";


// TODO: test return inside forEach and ifElse
// TODO: test redefine
// TODO: если в prop есть супер значение то им должно быть проставлено readonly
// TODO: если в prop не указан default значит он required


describe('superFunc', () => {
  it('change scope variable', async () => {
    const scope = newScope({topVal: 1})
    const func = await scope.$run({
      $exp: 'newSuperFunc',
      params: {
        p1: {
          type: 'number',
          default: 5
        }
      },
      lines: [
        {
          $exp: 'setValue',
          path: 'topVal',
          value: {
            $exp: 'getValue',
            path: 'params.p1',
          },
        }
      ]
    })

    assert.equal(func.$super.constructor.name, 'SuperFunc')

    await func.exec()

    assert.equal(scope['topVal'], 5)
  })

  it('set undefined to scope variable', async () => {
    const scope = newScope({topVal: 1})
    const func = await scope.$run({
      $exp: 'newSuperFunc',
      lines: [
        {
          $exp: 'setValue',
          path: 'topVal',
          value: undefined,
        }
      ]
    })

    assert.equal(func.$super.constructor.name, 'SuperFunc')

    await func.exec()

    assert.isUndefined(scope['topVal'])
  })

  it('set param and get in on return', async () => {
    const scope = newScope()
    const func = await scope.$run({
      $exp: 'newSuperFunc',
      params: {
        p1: {
          type: 'number'
        }
      },
      lines: [
        {
          $exp: 'superReturn',
          value: {
            $exp: 'getValue',
            path: 'params.p1',
          },
        }
      ]
    })
    // try to apply but it shouldn't be in final result
    func.applyValues({p1: 4})
    // call via proxy
    const returned = await func({p1: 5})

    assert.equal(returned, 5)
  })

  it('apply values', async () => {
    const scope = newScope()
    const func = await scope.$run({
      $exp: 'newSuperFunc',
      params: {
        p1: {
          type: 'number'
        }
      },
      lines: [
        {
          $exp: 'superReturn',
          value: {
            $exp: 'getValue',
            path: 'params.p1',
          },
        }
      ]
    })

    func.applyValues({p1: 4})
    // call via proxy
    const returned = await func()

    assert.equal(returned, 4)
  })

})
