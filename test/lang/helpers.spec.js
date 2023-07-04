import {removeExpressions, leaveOnlyExpressions, isSprogLang} from "../../src/index.js";


describe('helpers', () => {
  it('isSprogLang', async () => {
    assert.isTrue(isSprogLang({$exp: 'getValue'}))
    assert.isFalse(isSprogLang({$exp: 'some'}))
    assert.isFalse(isSprogLang({some: 1}))
    assert.isFalse(isSprogLang({}))
    assert.isFalse(isSprogLang([]))
    assert.isFalse(isSprogLang(undefined))
    assert.isFalse(isSprogLang(null))
    assert.isFalse(isSprogLang(1))
    assert.isFalse(isSprogLang('s'))
  })

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

  it('leaveOnlyExpressions', async () => {
    assert.deepEqual(
      leaveOnlyExpressions({
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
