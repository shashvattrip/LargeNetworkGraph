ccNetViz = function(canvas, options) {
    options = options || {};
    options.styles = options.styles || {};
    var currentNodes;
    var currentEdges;
    var backgroundStyle = options.styles.background = options.styles.background || {};
    var backgroundColor = new ccNetViz.color(backgroundStyle.color || "rgb(255, 255, 255)");

    var nodeStyle = options.styles.node = options.styles.node || {};
    nodeStyle.minSize = nodeStyle.minSize != null ? nodeStyle.minSize : 6;
    nodeStyle.maxSize = nodeStyle.maxSize || 16;
    nodeStyle.color = nodeStyle.color || "rgb(255, 255, 255)";

    if (nodeStyle.label) {
        var s = nodeStyle.label;
        s.color = s.color || "rgb(120, 120, 120)";
    }

    var edgeStyle = options.styles.edge = options.styles.edge || {};
    edgeStyle.width = edgeStyle.width || 1;
    edgeStyle.color = edgeStyle.color || "rgb(204, 204, 204)";

    if (edgeStyle.arrow) {
        var s = edgeStyle.arrow;
        s.minSize = s.minSize != null ? s.minSize : 6;
        s.maxSize = s.maxSize || 12;
        s.aspect = 1;
    }

    var offset = 0.5 * nodeStyle.maxSize;

    this.set = function(nodes, edges, layout) {
        this.nodes = nodes = nodes || [];
        currentNodes = this.nodes;
        this.edges = edges = edges || [];
        currentEdges = this.edges;
        layout = layout || "random";

        var created = !nodes.some(function(e)  {return e.x == null || e.y == null;});
        (created || (!created && new ccNetViz.layout[layout](nodes, edges).apply())) && ccNetViz.layout.normalize(nodes);

        var normalize = function(a, b)  {
            var x = b.x - a.x;
            var y = b.y - a.y;
            var sc = 1 / Math.sqrt(x*x + y*y);
            return { x: sc * x, y: sc * y };
        };

        scene.nodes.set(gl, options.styles, textures, nodes, function(style)  {return {
            set: function(v, e, iV, iI)  {
                var x = e.x;
                var y = e.y;
                ccNetViz.primitive.vertices(v.position, iV, x, y, x, y, x, y, x, y);
                ccNetViz.primitive.vertices(v.textureCoord, iV, 0, 0, 1, 0, 1, 1, 0, 1);
            }};}
        );

        if (nodeStyle.label) {
            texts.set(nodes, function(e)  {return e.label;});
            scene.labels.set(gl, options.styles, textures, nodes, function(style)  {
                style.texture = texts.texture;
                return {
                    set: function(v, e, iV, iI)  {
                        var x = e.x;
                        var y = e.y;
                        ccNetViz.primitive.vertices(v.position, iV, x, y, x, y, x, y, x, y);
                        var t = texts.get(e.label);
                        var dx = x < 0.5 ? 0 : -t.width;
                        var dy = y < 0.5 ? 0 : -t.height;
                        ccNetViz.primitive.vertices(v.relative, iV, dx, dy, t.width + dx, dy, t.width + dx, t.height + dy, dx, t.height + dy);
                        ccNetViz.primitive.vertices(v.textureCoord, iV, t.left, t.bottom, t.right, t.bottom, t.right, t.top, t.left, t.top);
                }}
            });
        }

        scene.edges.set(gl, options.styles, textures, edges, function(style)  {return {
            set: function(v, e, iV, iI)  {
                var s = e.source;
                var t = e.target;
                var d = normalize(s, t);
                ccNetViz.primitive.vertices(v.position, iV, s.x, s.y, s.x, s.y, t.x, t.y, t.x, t.y);
                ccNetViz.primitive.vertices(v.normal, iV, -d.y, d.x, d.y, -d.x, d.y, -d.x, -d.y, d.x);
            }};}
        );

        edgeStyle.arrow && scene.arrows.set(gl, options.styles, textures, edges, function(style)  {return {
            set: function(v, e, iV, iI)  {
                var s = e.source;
                var t = e.target;
                var d = normalize(s, t);
                ccNetViz.primitive.vertices(v.position, iV, t.x, t.y, t.x, t.y, t.x, t.y, t.x, t.y);
                ccNetViz.primitive.vertices(v.direction, iV, d.x, d.y, d.x, d.y, d.x, d.y, d.x, d.y);
                ccNetViz.primitive.vertices(v.textureCoord, iV, 0, 0, 1, 0, 1, 1, 0, 1);
            }};}
        );
    }

    this.draw = function()  {
        window.requestAnimationFrame(function()  {
            var width = canvas.width;
            var height = canvas.height;

            gl.viewport(0, 0, width, height);

            var o = view.size === 1 ? offset : 0;
            var ox = o / width;
            var oy = o / height;
            var transform = ccNetViz.gl.ortho(view.x - ox, view.x + view.size + ox, view.y - oy, view.y + view.size + oy, -1, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);

            var context = {
                width: 0.5 * width,
                height: 0.5 * height,
                style: nodeStyle,
                count: this.nodes.length
            };
            context.nodeSize = getSize(context, 0.4);

            scene.elements.forEach(function(e)  {return e.draw(context, transform);});
        }.bind(this));
    }.bind(this)

    this.resize = function() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }

    this.resetView = function() {
        view.size = 1;
        view.x = view.y = 0;
    }

    this.resize();

    this.nodes = [];
    this.edges = [];

    var view = {};
    this.resetView();

    var gl = getContext();
    var textures = new ccNetViz.textures(this.draw);
    var texts = new ccNetViz.texts(gl);
    var scene = createScene.call(this);
    // console.log(scene);

    var getSize = function(c, sc)  {
        var result = Math.min(c.style.maxSize, sc * Math.sqrt(c.width * c.height / c.count) / view.size);
        return result < c.style.hideSize ? 0 : Math.max(c.style.minSize, result);
    }

    scene.add("edges", new ccNetViz.primitive(gl, edgeStyle, null, [
            "attribute vec2 position;",
            "attribute vec2 normal;",
            "uniform vec2 width;",
            "uniform mat4 transform;",
            "varying vec2 n;",
            "void main(void) {",
            "   gl_Position = vec4(width * normal, 0, 0) + transform * vec4(position, 0, 1);",
            "   n = normal;",
            "}"
        ], [
            "precision mediump float;",
            "uniform vec4 color;",
            "varying vec2 n;",
            "void main(void) {",
            "   gl_FragColor = vec4(color.r, color.g, color.b, color.a - length(n));",
            "}"
        ], function(c)  {
            gl.uniform2f(c.shader.uniforms.width, c.style.width / c.width, c.style.width / c.height);
            ccNetViz.gl.uniformColor(gl, c.shader.uniforms.color, c.style.color);
        })
    );
    edgeStyle.arrow && scene.add("arrows", new ccNetViz.primitive(gl, edgeStyle, "arrow", [
            "attribute vec2 position;",
            "attribute vec2 direction;",
            "attribute vec2 textureCoord;",
            "uniform float offset;",
            "uniform vec2 size;",
            "uniform vec2 screen;",
            "uniform float aspect;",
            "uniform mat4 transform;",
            "varying vec2 tc;",
            "void main(void) {",
            "   vec2 u = direction / length(screen * direction);",
            "   vec2 v = vec2(u.y, -u.x * aspect);",
            "   v = v / length(screen * v);",
            "   gl_Position = vec4(size.x * (0.5 - textureCoord.x) * v - size.y * textureCoord.y * u - offset * u, 0, 0) + transform * vec4(position, 0, 1);",
            "   tc = textureCoord;",
            "}"
        ], [
            "precision mediump float;",
            "uniform vec4 color;",
            "uniform sampler2D texture;",
            "varying vec2 tc;",
            "void main(void) {",
            "   gl_FragColor = color * texture2D(texture, vec2(tc.s, tc.t));",
            "}"
        ], function(c)  {
            var size = getSize(c, 0.2);
            if (!size) return true;
            gl.uniform1f(c.shader.uniforms.offset, 0.5 * c.nodeSize);
            gl.uniform2f(c.shader.uniforms.size, size, c.style.aspect * size);
            gl.uniform2f(c.shader.uniforms.screen, c.width, c.height);
            var aspect = c.width / c.height;
            gl.uniform1f(c.shader.uniforms.aspect, aspect * aspect);
            ccNetViz.gl.uniformColor(gl, c.shader.uniforms.color, c.style.color);
        })
    );
    scene.add("nodes", new ccNetViz.primitive(gl, nodeStyle, null, [
            "attribute vec2 position;",
            "attribute vec2 textureCoord;",
            "uniform vec2 size;",
            "uniform mat4 transform;",
            "varying vec2 tc;",
            "void main(void) {",
            "   gl_Position = vec4(size * (textureCoord - vec2(0.5, 0.5)), 0, 0) + transform * vec4(position, 0, 1);",
            "   tc = textureCoord;",
            "}"
        ], [
            "precision mediump float;",
            "uniform vec4 color;",
            "uniform sampler2D texture;",
            "varying vec2 tc;",
            "void main(void) {",
            "   gl_FragColor = color * texture2D(texture, vec2(tc.s, tc.t));",
            "}"
        ], function(c)  {
            var size = getSize(c, 0.4);
            gl.uniform2f(c.shader.uniforms.size, size / c.width, size / c.height);
            ccNetViz.gl.uniformColor(gl, c.shader.uniforms.color, c.style.color);
        })
    );
    nodeStyle.label && scene.add("labels", new ccNetViz.primitive(gl, nodeStyle, "label", [
            "attribute vec2 position;",
            "attribute vec2 relative;",
            "attribute vec2 textureCoord;",
            "uniform float offset;",
            "uniform vec2 scale;",
            "uniform mat4 transform;",
            "varying vec2 tc;",
            "void main(void) {",
            "   gl_Position = vec4(scale * (relative + vec2(0, sign(0.5 - position.y) * offset)), 0, 0) + transform * vec4(position, 0, 1);",
            "   tc = textureCoord;",
            "}"
        ], [
            "precision mediump float;",
            "uniform vec4 color;",
            "uniform sampler2D texture;",
            "varying vec2 tc;",
            "void main(void) {",
            "   gl_FragColor = color * texture2D(texture, vec2(tc.s, tc.t));",
            "}"
        ], function(c)  {
            if (!getSize(c, 0.4)) return true;
            gl.uniform1f(c.shader.uniforms.offset, 0.5 * c.nodeSize);
            gl.uniform2f(c.shader.uniforms.scale, 1 / c.width, 1 / c.height);
            ccNetViz.gl.uniformColor(gl, c.shader.uniforms.color, c.style.color);
        })
    );

    gl.clearColor(backgroundColor.r, backgroundColor.g, backgroundColor.b, backgroundColor.a);
    gl.blendEquation(gl.FUNC_ADD);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE);
    gl.enable(gl.BLEND);

    canvas.addEventListener("mousedown", onMouseDown.bind(this));
    canvas.addEventListener("wheel", onWheel.bind(this));

    function onWheel(e) {
        var rect = canvas.getBoundingClientRect();
        var size = Math.min(1.0, view.size * (1 + 0.001 * (e.deltaMode ? 33 : 1) * e.deltaY));
        var delta = size - view.size;

        view.size = size;
        view.x = Math.max(0, Math.min(1 - size, view.x - delta * (e.clientX - rect.left) / canvas.width));
        view.y = Math.max(0, Math.min(1 - size, view.y - delta * (1 - (e.clientY - rect.top) / canvas.height)));

        this.draw();
    }

    function onMouseDown(e) {
        var width = canvas.width / view.size;
        var height = canvas.height / view.size;
        var dx = view.x + e.clientX / width; //dx,dy are ratios 
        var dy = e.clientY / height - view.y;
        clicked(e);
        var drag = function(e)  {
            view.x = Math.max(0, Math.min(1 - view.size, dx - e.clientX / width));
            view.y = Math.max(0, Math.min(1 - view.size, e.clientY / height - dy));
            this.draw();
        }.bind(this);

        var up = function(e)  {
            window.removeEventListener('mouseup', up);
            window.removeEventListener('mousemove', drag);
        };
        window.addEventListener('mouseup', up);
        window.addEventListener('mousemove', drag);

        e.preventDefault();
    }

    function getContext() {
        var attributes = { depth: false, antialias: false };
        return canvas.getContext('webgl', attributes) || canvas.getContext('experimental-webgl', attributes);
    }

    function createScene() {
        return {
            elements: [],
            add: function(name, e)  {
                scene[name] = e;
                scene.elements.push(e);
            }
        };
    }

    function nodeSelection(node) {
        console.log(node);
    }

    function clicked(e) {
        if(typeof e == "undefined") return;
        console.log(currentEdges);
        quadTree = ccNetViz.quadtree(currentNodes, currentEdges);
        var _node = quadTree.find(e.x/canvas.width,1-e.y/canvas.height);
        console.log(_node);
        console.log("Quadtree is", quadTree);
        //finding the nearest edge
        var _edge = quadTree.findEdge(e.x/canvas.width,1-e.y/canvas.height);
        console.log(_edge);
    }

}