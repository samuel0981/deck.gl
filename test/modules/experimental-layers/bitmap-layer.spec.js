import test from 'tape-catch';

import BitmapLayer from '@deck.gl/experimental-layers/bitmap-layer/bitmap-layer';
import {testLayer} from '@deck.gl/test-utils';

test('BitmapLayer#constructor', t => {
  testLayer({
    Layer: BitmapLayer,
    testCases: [
      {
        title: 'Empty layer',
        props: {id: 'empty'}
      },
      {
        title: 'Null layer',
        props: {id: 'null', data: null}
      },
      {
        updateProps: {
          bitmapBounds: [[2, 4, 1], [16, 4, 1], [16, 8, 1], [2, 8, 1]]
        },
        assert({layer, oldState}) {
          t.ok(layer.state, 'should update layer state');
          t.deepEqual(
            layer.state.model.program.uniforms.leftBottom,
            [2, 4, 1],
            'should update leftBottom'
          );
          t.deepEqual(
            layer.state.model.program.uniforms.rightBottom,
            [16, 4, 1],
            'should update rightBottom'
          );
          t.deepEqual(
            layer.state.model.program.uniforms.rightTop,
            [16, 8, 1],
            'should update rightTop'
          );
          t.deepEqual(
            layer.state.model.program.uniforms.leftTop,
            [2, 8, 1],
            'should update leftTop'
          );
        }
      },
      {
        updateProps: {
          bitmapBounds: [2, 4, 16, 8]
        },
        assert({layer, oldState}) {
          t.ok(layer.state, 'should update layer state');
          t.deepEqual(
            layer.state.model.program.uniforms.leftBottom,
            [2, 4, 0],
            'should update leftBottom'
          );
          t.deepEqual(
            layer.state.model.program.uniforms.rightBottom,
            [16, 4, 0],
            'should update rightBottom'
          );
          t.deepEqual(
            layer.state.model.program.uniforms.rightTop,
            [16, 8, 0],
            'should update rightTop'
          );
          t.deepEqual(
            layer.state.model.program.uniforms.leftTop,
            [2, 8, 0],
            'should update leftTop'
          );
        }
      },
      {
        updateProps: {
          tintColor: [255, 255, 0]
        },
        assert({layer, oldState}) {
          t.ok(layer.state, 'should update layer state');
          t.deepEqual(
            layer.state.model.program.uniforms.tintColor,
            [255, 255, 0],
            'should update tintColor'
          );
        }
      }
    ]
  });

  t.end();
});
