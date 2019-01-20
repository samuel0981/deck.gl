// Copyright (c) 2015 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

/* global Image, HTMLCanvasElement */
import {Layer} from '@deck.gl/core';
import GL from '@luma.gl/constants';
import {Model, Geometry, loadTextures, Texture2D} from 'luma.gl';

import vs from './bitmap-layer-vertex';
import fs from './bitmap-layer-fragment';

const defaultProps = {
  data: [{}],
  image: null,
  bitmapBounds: {type: 'array', value: [0, 0, 1, 1], compare: true},

  desaturate: {type: 'number', min: 0, max: 1, value: 0},
  blendMode: null,
  // More context: because of the blending mode we're using for ground imagery,
  // alpha is not effective when blending the bitmap layers with the base map.
  // Instead we need to manually dim/blend rgb values with a background color.
  transparentColor: {type: 'color', value: [0, 0, 0, 0]},
  tintColor: {type: 'color', value: [255, 255, 255]}
};

/*
 * @class
 * @param {object} props
 * @param {number} props.transparentColor - color to interpret transparency to
 * @param {number} props.tintColor - color bias
 */
export default class BitmapLayer extends Layer {
  getShaders() {
    const projectModule = this.use64bitProjection() ? 'project64' : 'project32';
    return {vs, fs, modules: [projectModule, 'picking']};
  }

  initializeState() {
    const {gl} = this.context;
    this.setState({model: this.getModel(gl)});
  }

  updateState({props, oldProps, changeFlags}) {
    if (props.image !== oldProps.image) {
      this.loadImage();
    }

    const {model} = this.state;
    const {bitmapBounds, desaturate, transparentColor, tintColor} = props;

    if (oldProps.bitmapBounds !== bitmapBounds) {
      const bitmapBoundPositions = this.calculateBitmapBounds(bitmapBounds);
      // set the four corner positions of bitmap
      model.setUniforms({
        leftBottom: bitmapBoundPositions[0],
        rightBottom: bitmapBoundPositions[1],
        rightTop: bitmapBoundPositions[2],
        leftTop: bitmapBoundPositions[3]
      });
    }

    if (
      oldProps.desaturate !== desaturate ||
      oldProps.transparentColor !== transparentColor ||
      oldProps.tintColor !== tintColor
    )
      model.setUniforms({
        desaturate,
        transparentColor,
        tintColor
      });
  }

  getModel(gl) {
    // Two triangles making up a square to render the bitmap texture on
    const verts = [[1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0]];
    const positions = [];
    const texCoords = [];
    verts.forEach(vertex => {
      // geometry: unit square centered on origin
      positions.push(vertex[0] / 2, vertex[1] / 2, vertex[2] / 2);
      // texture: unit square with bottom left in origin
      texCoords.push(vertex[0] / 2 + 0.5, -vertex[1] / 2 + 0.5);
    });

    return new Model(
      gl,
      Object.assign({}, this.getShaders(), {
        id: this.props.id,
        shaderCache: this.context.shaderCache,
        geometry: new Geometry({
          drawMode: GL.TRIANGLES,
          vertexCount: 6,
          attributes: {
            texCoords: new Float32Array(texCoords)
          }
        }),
        isInstanced: true
      })
    );
  }

  draw({uniforms}) {
    const {bitmapTexture} = this.state;

    // TODO fix zFighting
    // Render the image
    if (bitmapTexture) {
      this.state.model.render(
        Object.assign({}, uniforms, {
          bitmapTexture
        })
      );
    }
  }

  loadImage() {
    const {gl} = this.context;
    const {image} = this.props;

    if (typeof image === 'string') {
      loadTextures(this.context.gl, {
        urls: [image]
      }).then(([texture]) => {
        this.setState({bitmapTexture: texture});
      });
    } else if (image instanceof Texture2D) {
      this.setState({bitmapTexture: image});
    } else if (
      // browser object
      image instanceof Image ||
      image instanceof HTMLCanvasElement
    ) {
      this.setState({bitmapTexture: new Texture2D(gl, {data: image})});
    }
  }

  calculateBitmapBounds() {
    const {bitmapBounds} = this.props;
    const positions = [];

    // bitmapBounds as [left, bottom, right, top]
    if (Number.isFinite(bitmapBounds[0])) {
      /*
        (l0, t3) ----- (r2, t3)
           |              |
           |              |
           |              |
        (l0, b1) ----- (l2, s1)
     */
      positions[0] = [bitmapBounds[0], bitmapBounds[1], 0];
      positions[1] = [bitmapBounds[2], bitmapBounds[1], 0];
      positions[2] = [bitmapBounds[2], bitmapBounds[3], 0];
      positions[3] = [bitmapBounds[0], bitmapBounds[3], 0];
    } else {
      // [[x, y], ...] or [[x, y, z], ...]
      positions[0] = bitmapBounds[0];
      positions[1] = bitmapBounds[1];
      positions[2] = bitmapBounds[2];
      positions[3] = bitmapBounds[3];
    }

    for (const position of positions) {
      if (position.length === 2) {
        position.push(0);
      }
    }

    return positions;
  }
}

BitmapLayer.layerName = 'BitmapLayer';
BitmapLayer.defaultProps = defaultProps;
