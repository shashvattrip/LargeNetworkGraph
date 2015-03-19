ccNetViz.layout.random = function(nodes) {
    this.apply = function() {
        for (var i = 0, n = nodes.length; i < n; i++) {
            var o = nodes[i];
            o.x = Math.random();
            o.y = Math.random();
        }
    }
}