ccNetViz.primitive = function(gl, baseStyle, styleProperty, vs, fs, bind) {
    var shader = new ccNetViz.shader(gl, vs.join('\n'), fs.join('\n'));
    var buffers = [];
    var sections = [];
    var count = 0;

    this.set = (gl, styles, textures, data, get) => {
        count = data.length;
        var parts = {};
        for (var i = 0; i < count; i++) {
            var e = data[i];
            var part = parts[e.style] = parts[e.style] || [];
            part.push(e);
        }

        var iV, iI, iS = 0, iB = 0;
        var e = {};

        var init = (filler, n) => {
            iV = iI = 0;
            var max = Math.floor(ccNetViz.primitive.maxBufferSize / filler.numVertices);
            var nV = Math.min(max, n - (iB - iS)*max);
            var nI = nV * filler.numIndices;

            if (!e.indices || e.indices.length !== nI) {
                e.indices = new Uint16Array(nI);
                nV *= 2*filler.numVertices;
                for (var a in shader.attributes) e[a] = new Float32Array(nV);
            }
        };

        var store = section => {
            var b = buffers[iB];
            if (!b) {
                buffers[iB] = b = {};
                for (var a in e) b[a] = gl.createBuffer();
            }
            for (var a in shader.attributes) {
                gl.bindBuffer(gl.ARRAY_BUFFER, b[a]);
                gl.bufferData(gl.ARRAY_BUFFER, e[a], gl.STATIC_DRAW);
            }
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b.indices);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, e.indices, gl.STATIC_DRAW);
            b.count = iI;
            section.buffers.push(b);
            iB++;
        };

        var createStyle = style => {
            var result = {};

            var copy = s => {
                if (s) for (var p in s) result[p] = s[p];
            };

            copy(baseStyle);
            copy(style);

            if (styleProperty) {
                copy(baseStyle[styleProperty]);
                style && copy(style[styleProperty]);
            }
            result.color = result.color && new ccNetViz.color(result.color);
            return result;
        };

        sections = [];
        for (var p in parts) {
            iS = iB;

            var section = {
                style: createStyle(styles[p]),
                buffers: []
            };

            var filler = get(section.style);
            filler.numVertices = filler.numVertices || 4;
            filler.numIndices = filler.numIndices || 6;

            var part = parts[p];
            init(filler, part.length);
            var max = ccNetViz.primitive.maxBufferSize - filler.numVertices;
            for (var i = 0; i < part.length; i++, iV += filler.numVertices, iI += filler.numIndices) {
                if (iV > max) {
                    store(section);
                    init(filler, part.length);
                }
                filler.set(e, part[i], iV, iI);
                ccNetViz.primitive.indices(e.indices, iV, iI, 0, 1, 2, 2, 3, 0);
            }
            store(section);

            function add() {
                sections.push(this);
            }
            var addSection = add.bind(section);

            typeof section.style.texture === 'string' ? section.style.texture = textures.get(gl, section.style.texture, addSection) : addSection();
        }
    }

    this.draw = (context, transform) => {
        context.shader = shader;
        context.count = count;
        shader.bind();

        gl.uniformMatrix4fv(shader.uniforms.transform, false, transform);

        sections.forEach(section => {
            if (section.style.texture) {
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, section.style.texture);
                gl.uniform1i(shader.uniforms.texture, 0);
            }

            context.style = section.style;
            if (bind(context)) return;

            section.buffers.forEach(e => {
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, e.indices);

                for (var a in shader.attributes) {
                    gl.bindBuffer(gl.ARRAY_BUFFER, e[a]);
                    gl.vertexAttribPointer(shader.attributes[a], 2, gl.FLOAT, false, 0, 0);
                }

                gl.drawElements(gl.TRIANGLES, e.count, gl.UNSIGNED_SHORT, 0);
            });
        });

        shader.unbind();
    }
}

ccNetViz.primitive.vertices = function(buffer, iV) {
    iV *= 2;
    for (var i = 2, n = arguments.length; i < n; i++) buffer[iV++] = arguments[i];
}

ccNetViz.primitive.indices = function(buffer, iV, iI) {
    for (var i = 3, n = arguments.length; i < n; i++) buffer[iI++] = iV + arguments[i];
}

ccNetViz.primitive.maxBufferSize = 65536;