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
              items: [
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
              items: [
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

  it('else if', async () => {
    const scope = newScope({topVal: 1})

    await scope.$run({
      $exp: 'ifElse',
      items: [
        // if - false
        {
          condition: [
            {
              $exp: 'isEqual',
              items: [ 1, 2 ]
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
        // else if - true
        {
          condition: [
            {
              $exp: 'isEqual',
              items: [ 1, 1 ]
            },
          ],
          lines: [
            {
              $exp: 'setValue',
              path: 'topVal',
              value: 7
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

    assert.equal(scope['topVal'], 7)
  })


  // TODO: test and, or
  // TODO: test return
  // TODO: test nested if
  // TODO: test break
  // TODO: test continue

})
