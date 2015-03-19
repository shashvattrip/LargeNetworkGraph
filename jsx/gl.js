ccNetViz.gl = function() {}

ccNetViz.gl.createShader = function(gl, type, source) {
    var result = gl.createShader(type);
    gl.shaderSource(result, source);
    gl.compileShader(result);

    if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) {
        console.log(gl.getShaderInfoLog(result));
        return null;
    }
    return result;
}

ccNetViz.gl.createTexture = function(gl, img, onLoad) {
    var result = gl.createTexture();

    function load() {
        gl.bindTexture(gl.TEXTURE_2D, result);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.bindTexture(gl.TEXTURE_2D, null);
        onLoad && onLoad();
    }

    var image = new Image();
    image.onload = load;
    image.src = img;
    image.naturalWidth && image.naturalHeight && load();
    return result;
}

ccNetViz.gl.uniformColor = function(gl, location, color) {
    gl.uniform4f(location, color.r, color.g, color.b, color.a);
}

ccNetViz.gl.ortho = function(left, right, bottom, top, near, far) {
    var lr = 1 / (left - right),
        bt = 1 / (bottom - top),
        nf = 1 / (near - far);

    var result = new Float32Array(16);
    result[0] = -2 * lr;
    result[1] = 0;
    result[2] = 0;
    result[3] = 0;
    result[4] = 0;
    result[5] = -2 * bt;
    result[6] = 0;
    result[7] = 0;
    result[8] = 0;
    result[9] = 0;
    result[10] = 2 * nf;
    result[11] = 0;
    result[12] = (left + right) * lr;
    result[13] = (top + bottom) * bt;
    result[14] = (far + near) * nf;
    result[15] = 1;
    return result;
}