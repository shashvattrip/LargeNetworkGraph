ccNetViz.layout = function() {}

ccNetViz.layout.normalize = function(nodes) {
    var n = nodes.length;
    var maxX = -Infinity;
    var maxY = -Infinity;
    var minX = Infinity;
    var minY = Infinity;

    for (var i = 0; i < n; i++) {
        var o = nodes[i];
        maxX = Math.max(maxX, o.x);
        maxY = Math.max(maxY, o.y);
        minX = Math.min(minX, o.x);
        minY = Math.min(minY, o.y);
    };

    var scX = 1 / (maxX - minX);
    var scY = 1 / (maxY - minY);

    for (var i = 0; i < n; i++) {
        var o = nodes[i];
        o.x = scX * (o.x - minX);
        o.y = scY * (o.y - minY);
    }
}