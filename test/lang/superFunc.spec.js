import {newScope} from "../../src/index.js";
import {newSuperFunc} from "../../src/lang/superFunc.js";


describe('superFunc', () => {
  it.only('change to scope variable', async () => {
    const scope = newScope({topVal: 1})
    const func = await scope.$run({
      $exp: 'newSuperFunc',
      props: {
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
            path: 'props.p1',
          },
        }
      ]
    })

    await func.exec()

    assert.equal(scope['topVal'], 5)
  })

  it.only('set prop and get in on return', async () => {
    const scope = newScope()
    const func = await scope.$run({
      $exp: 'newSuperFunc',
      props: {
        p1: {
          type: 'number'
        }
      },
      lines: [
        {
          $exp: 'superReturn',
          value: {
            $exp: 'getValue',
            path: 'props.p1',
          },
        }
      ]
    })

    const returned = await func.exec({p1: 5})

    assert.equal(returned, 5)
  })

})
