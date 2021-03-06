var assert = require('assert')
var Theme = require('../src/react-theme')

describe('Theme', () => {
  it('is creatable', () => {
    assert(new Theme())
  })

  it('takes initial state', () => {
    var sources = {}
    var theme = new Theme(sources)

    assert.strictEqual(sources, theme._sources)
  })

  it('can get', () => {
    var theme = new Theme()
    theme.setSource('a', () => ({foo: 1}))

    //this will warn
    var style = theme.get('a')

    assert.strictEqual(style.foo, 1)
  })

  it('throws on getStyle of undefined style source', () => {
    var theme = new Theme()

    assert.throws(() => theme.getStyle('unknown'), Error)
  })

  it('throws on style source don\'t returns an object', () => {
    var theme = new Theme()
    theme.setSource('a', () => false)

    assert.throws(() => theme.getStyle('a'), Error)
  })

  it('lets use the deprecated get() alias', () => {
    var theme = new Theme()
    theme.setSource('a', () => ({foo: 1}))

    var style = theme.getStyle('a')

    assert.strictEqual(style.foo, 1)
  })

  it('is cloneable', () => {
    var theme = new Theme()
    var processor = () => {}
    theme.setSource('a', () => ({foo: 1}))
    theme.setPostProcessor(processor)
    var themeClone = theme.clone()

    assert.strictEqual(themeClone.getPostProcessor(), processor)
    assert.notEqual(themeClone, theme)
    assert.deepEqual(theme.getStyle('a'), themeClone.getStyle('a'))
  })

  it('merges mixins in order and removes them', () => {
    var theme = new Theme()

    theme.setSource('a', () => ({foo: 1, bar: 1, baz: 1}))
    theme.setSource('b', () => ({foo: 2, bar: 2}))
    theme.setSource('c', () => ({
      mixins: ['a', 'b'],
      foo: 3
    }))

    var style = theme.getStyle('c')

    assert.deepEqual(style, {foo: 3, bar: 2, baz: 1})
    assert.strictEqual(style.mixins, undefined)
  })

  it('extend with extendSource', () => {
    var theme = new Theme()

    theme.setSource('a', () => ({foo: 1, bar: 1}))
    theme.extendSource('a', () => ({foo: 2}))

    var style = theme.getStyle('a')

    assert.deepEqual(style, {foo: 2, bar: 1})
  })

  it('use setSource instead of extendSource if the selected name free', () => {
    var theme = new Theme()
    var extender = () => {}
    theme.setSource = (name, source) => {
      assert.strictEqual(extender, source)
    }
    theme.extendSource('a', extender)
  })

  it('passes itself to the source function', () => {
    var theme = new Theme()

    theme.setSource('a', (_theme) => {
      assert.strictEqual(_theme, theme)
      return {}
    })

    theme.getStyle('a')
  })

  it('can teme.getStyle() in source function', () => {
    var theme = new Theme()

    theme.setSource('a', () => ({foo: 1}))
    theme.setSource('b', (theme) => {
      var style = theme.getStyle('a')
      assert.strictEqual(style.foo, 1)
      return {qux: style.foo}
    })

    var style = theme.getStyle('b')
    assert.strictEqual(style.qux, 1)
  })

  it('passes mod to the source function', () => {
    var theme = new Theme()
    var mod = {}

    theme.setSource('a', (theme, _mod) => {
      assert.strictEqual(_mod, mod)
      return {}
    })
  })

  it('merges with additinal styles', () => {
    var theme = new Theme()
    theme.setSource('a', () => ({foo: 1, bar: 1}))

    var style = theme.getStyle('a', null, {foo: 2, baz: 0})
    assert.deepEqual(style, {foo: 2, bar: 1, baz: 0})
  })

  it('merges with additinal styles', () => {
    var theme = new Theme()
    theme.setSource('a', () => ({foo: 1, bar: 1}))

    var style = theme.getStyle('a', null, {foo: 2, baz: 0})
    assert.deepEqual(style, {foo: 2, bar: 1, baz: 0})
  })
})

describe('resolve modifiers', () => {
  it('resolves booleans', () => {
    var theme = new Theme()
    theme.setSource('a', () => ({
      qux: 1,
      quz: 2,
      foo: {qux: 3},
      bar: {qux: 4},
      baz: {qux: 5},
    }))

    var style = theme.getStyle('a', {foo: true, bar: false})
    assert.strictEqual(style.qux, 3)
    assert.strictEqual(style.quz, 2)
  })

  it('resolves keyeds', () => {
    var theme = new Theme()
    theme.setSource('a', () => ({
      qux: 1,
      quz: 2,
      taz: {
        foo: {qux: 3},
        bar: {qux: 4},
        baz: {qux: 5},
      }
    }))

    var style = theme.getStyle('a', {taz: 'bar'})
    assert.strictEqual(style.qux, 4)
    assert.strictEqual(style.quz, 2)
  })

  it('resolves nesteds', () => {
    var theme = new Theme()
    theme.setSource('a', () => ({
      qux: 1,
      taz: {
        qux: 3,
        foo: {
          qux: 4,
          bar: {
            qux: 5,
            taz: {
              foo: {qux: 6}
            }
          }
        }
      }
    }))

    var style = theme.getStyle('a', {taz: 'foo', bar: true})
    assert.strictEqual(style.qux, 6)
  })
})

describe('post processor', () => {
  it('can set/getPostProcessor', () => {
    var theme = new Theme()
    var processor = () => {}
    theme.setPostProcessor(processor)

    assert.strictEqual(theme.getPostProcessor(), processor)
  })

  it('applies processor', () => {
    var theme = new Theme()
    theme.setPostProcessor(style => {
      style.foo *= 2
      return style
    })
    theme.setSource('a', () => ({foo: 1}))

    var processedStyle = theme.getStyle('a')
    assert.strictEqual(processedStyle.foo, 2)
  })
})
