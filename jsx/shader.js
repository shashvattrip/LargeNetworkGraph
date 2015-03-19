ccNetViz.shader = function(gl, vs, fs) {
    var program = gl.createProgram();
    gl.attachShader(program, ccNetViz.gl.createShader(gl, gl.VERTEX_SHADER, vs));
    gl.attachShader(program, ccNetViz.gl.createShader(gl, gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(program);

    this.uniforms = {};
    var n = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < n; i++) {
        var name = gl.getActiveUniform(program, i).name;
        this.uniforms[name] = gl.getUniformLocation(program, name);
    }

    this.attributes = {};
    n = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for (var i = 0; i < n; i++) {
        this.attributes[gl.getActiveAttrib(program, i).name] = i;
    }

    this.bind = () => {
        gl.useProgram(program);
        for (var i = 0; i < n; i++) gl.enableVertexAttribArray(i);
    };

    this.unbind = () => {
        for (var i = 0; i < n; i++) gl.disableVertexAttribArray(i);
    };
}