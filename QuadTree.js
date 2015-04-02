shashvat.quadtree = function(points) {
    var d, xs, ys, i, n, x1_, y1_, x2_, y2_;

    function create() {
        return {
            leaf: true,
            nodes: [],
            point: null,
            x: null,
            y: null
        };
    }

    //0,0 - bottom left
    // 0.5,0.5 center
    // 1, 0 bottom right
    // 0,1 top right
    function visit(f, node, x1, y1, x2, y2) {
        if (!f(node, x1, y1, x2, y2)) {
            var sx = (x1 + x2) * 0.5;
            var sy = (y1 + y2) * 0.5;
            var children = node.nodes;

            if (children[0]) visit(f, children[0], x1, y1, sx, sy);
            if (children[1]) visit(f, children[1], sx, y1, x2, sy);
            if (children[2]) visit(f, children[2], x1, sy, sx, y2);
            if (children[3]) visit(f, children[3], sx, sy, x2, y2);
        }
    }

    var root = create();    //creates a node, as this is the first node for the constructor call, it's called the root

    root.visit = function(f)  {
        return visit(f, root, x1_, y1_, x2_, y2_);
    };
    

    return root;
};