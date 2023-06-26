import {newScope, removeExpressions} from "../../src/index.js";


describe('helpers', () => {

  it.only('removeExpressions', async () => {
    assert.deepEqual(
      removeExpressions({
        a: 1,
        exp: {$exp: 'getValue'},
        b: 's',
        expDeep: {
          a: 2,
          b: {$exp: 'getValue'},
          c: 3,
          d: {
            a: 1,
            b: {$exp: 'getValue'},
            c: {$exp: 'getValue'},
            d: 'g'
          },
          e: {$exp: 'getValue'},
        },
        exp2: {$exp: 'getValue'},
      }),
      {
        a: 1,
        b: 's',
        expDeep: {
          a: 2,
          c: 3,
          d: {
            a: 1,
            b: 'g'
          }
        }
      }
    )
  })

})
