ccNetViz.textures = function(onLoad) {
    var textures = {};
    var pending = {};
    var n = 0;

    this.get = function(gl, img, action) {
        var p = pending[img];
        var t = textures[img];

        if (p) {
            p.push(action);
        }
        else if (t) {
            action();
        }
        else {
            p = pending[img] = [action];
            n++;
            textures[img] = t = ccNetViz.gl.createTexture(gl, img, function()  {
                p.forEach(function(a)  {return a();});
                delete pending[img];
                --n || onLoad();
            });
        }
        return t;
    }
}