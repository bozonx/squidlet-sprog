import {removeExpressions, removeSimple} from "../../src/index.js";


describe('helpers', () => {
  it('removeExpressions', async () => {
    assert.deepEqual(
      removeExpressions({
        a: 1,
        b: {$exp: 'getValue'},
        c: 's',
        d: {
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
        e: {$exp: 'getValue'},
      }),
      {
        a: 1,
        c: 's',
        d: {
          a: 2,
          c: 3,
          d: {
            a: 1,
            d: 'g'
          }
        }
      }
    )
  })

  it('removeSimple', async () => {
    assert.deepEqual(
      removeSimple({
        a: 1,
        b: {$exp: 'getValue'},
        c: 's',
        d: {
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
        e: {$exp: 'getValue'},
      }),
      {
        b: {$exp: 'getValue'},
        d: {
          b: {$exp: 'getValue'},
          d: {
            b: {$exp: 'getValue'},
            c: {$exp: 'getValue'},
          },
          e: {$exp: 'getValue'},
        },
        e: {$exp: 'getValue'},
      }
    )
  })

})
