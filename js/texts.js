ccNetViz.texts = function(gl) {
    var size = 1024;
    var height = 12;

    var canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    canvas.style.width = canvas.style.height = size + 'px';
    canvas.style.display = "none";
    document.body.appendChild(canvas);

    this.texture = gl.createTexture();

    var texts;

    this.get = function(e)  {return texts[e];};

    this.set = function(data, get)  {
        texts = {};

        var c = canvas.getContext('2d');
        c.clearRect(0, 0, size, size);
        c.fillStyle = "white";
        c.textAlign = "left";
        c.textBaseline = "top";
        c.font = "11px Arial, Helvetica, sans-serif";

        for (var i = 0, x = 0, y = 0; i < data.length; i++) {
            var e = get(data[i]);
            if (texts[e]) continue;

            var width = c.measureText(e).width;
            if (x + width > size) {
                x = 0;
                y += height;
            }
            c.fillText(e, x, y);
            texts[e] = {
                width: width,
                height: height,
                left: x / size,
                right: (x + width) / size,
                top: y / size,
                bottom: (y + height) / size
            };
            x += width;
        }

        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }.bind(this);
}