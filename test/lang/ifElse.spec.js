import {newScope} from "../../src/index.js";
import {ifElse} from "../../src/lang/ifElse.js";
import {isEqual} from "../../src/lang/booleanLogic.js";


describe('ifElse', () => {
  it('common check', async () => {
    const scope = newScope({topVal: 1})

    await scope.$run({
      $exp: 'ifElse',
      items: [
        {
          condition: [
            {
              $exp: 'isEqual',
              values: [
                1,
                1
              ]
            },
          ],
          lines: [
            {
              $exp: 'setValue',
              path: 'topVal',
              value: 5
            }
          ]
        }
      ]
    })

    assert.equal(scope['topVal'], 5)
  })

  it('else', async () => {
    const scope = newScope({topVal: 1})

    await scope.$run({
      $exp: 'ifElse',
      items: [
        {
          condition: [
            {
              $exp: 'isEqual',
              values: [
                1,
                2
              ]
            },
          ],
          lines: [
            {
              $exp: 'setValue',
              path: 'topVal',
              value: 2
            }
          ]
        },
        // else
        {
          lines: [
            {
              $exp: 'setValue',
              path: 'topVal',
              value: 5
            }
          ]
        },
      ]
    })

    assert.equal(scope['topVal'], 5)
  })


  // TODO: test and, or
  // TODO: test if else
  // TODO: test else
  // TODO: test return
  // TODO: test break
  // TODO: test continue
  // TODO: test nested if

})
