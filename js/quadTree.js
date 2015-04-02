ccNetViz.quadtree = function(points, edges) {
    var d, xs, ys, i, n, x1_, y1_, x2_, y2_;
    var isEdge = false;
    //d = point
    // {
    //      index: 0
    //     label: "Node 0"
    //     px: -4.62990896429799
    //     py: -10.561184168305353
    //     style: "oddNode"
    //     weight: 4
    //     x: 0.29866843569966706
    //     y: 0
    // }

    // (x2_,y2_) represt positive INFINITY point
    // (x1_,y1_) represt negative INFINITY point
    x2_ = y2_ = -(x1_ = y1_ = Infinity);
    xs = [], ys = [];   //xs:array of all x coordinates
    //ys:array of all y coordinates
    n = points.length;    //number of points 

    for (i = 0; i < n; ++i) {
        d = points[i];
        if (d.x < x1_) x1_ = d.x;
        if (d.y < y1_) y1_ = d.y;
        if (d.x > x2_) x2_ = d.x;
        if (d.y > y2_) y2_ = d.y;
        xs.push(d.x);   
        ys.push(d.y); 

    }
    // console.log(xs,ys);
    var dx = x2_ - x1_; //difference between postive and negative infinites
    var dy = y2_ - y1_;
    // console.log(dx,dy);
    dx > dy ? y2_ = y1_ + dx : x2_ = x1_ + dy;  //TODO:what does it mean?

    function create() {
        return {
            leaf: true,
            nodes: [],
            point: null,
            x: null,
            y: null
        };
    }

    function visit(f, node, x1, y1, x2, y2) {
        if (!f(node, x1, y1, x2, y2)) {
            var sx = (x1 + x2) * 0.5;   //bisecting the x axis
            var sy = (y1 + y2) * 0.5;   //bisecting the y-axis
            var children = node.nodes;

            if (children[0]) visit(f, children[0], x1, y1, sx, sy);
            if (children[1]) visit(f, children[1], sx, y1, x2, sy);
            if (children[2]) visit(f, children[2], x1, sy, sx, y2);
            if (children[3]) visit(f, children[3], sx, sy, x2, y2);
        }
    }

    // insert(root, points[i], xs[i], ys[i], x1_, y1_, x2_, y2_)
    function insert(n, d, x, y, x1, y1, x2, y2) {
        if (n.leaf) {
            var nx = n.x;
            var ny = n.y;

            if (nx !== null) {
                if (nx === x && ny === y) {
                    insertChild(n, d, x, y, x1, y1, x2, y2);
                }
                else {
                    var nPoint = n.point;
                    n.x = n.y = n.point = null;
                    insertChild(n, nPoint, nx, ny, x1, y1, x2, y2);
                    insertChild(n, d, x, y, x1, y1, x2, y2);
                }
            } else {
                n.x = x, n.y = y, n.point = d;
            }
        } else {
            insertChild(n, d, x, y, x1, y1, x2, y2);
        }
    }

    // insertChild(root, point, xs[i], ys[i], x1_, y1_, x2_, y2_)
    function insertChild(n, d, x, y, x1, y1, x2, y2) {
        var xm = (x1 + x2) * 0.5;   //bisecting the x-axis, division between left and right sides of the quadrants
        var ym = (y1 + y2) * 0.5;   //bisecting the y-axis, division between top and bottom parts of the quadrants
        var right = x >= xm;        //does the point lie on the right side?
        var below = y >= ym;        //does the point lie below the horizontal axis?
        var i = below << 1 | right; //Bitwise shifting any number x to the left by y bits yields x * 2^y.
                                    //determines which quadrant to put the new node in

        n.leaf = false;
        n = n.nodes[i] || (n.nodes[i] = create());

        right ? x1 = xm : x2 = xm;  //adjust the boundaries of the new quadrant
        below ? y1 = ym : y2 = ym;
        insert(n, d, x, y, x1, y1, x2, y2);
    }

    function findNode(root, x, y, x0, y0, x3, y3) {
        var minDistance2 = Infinity;
        var closestPoint;

        (function find(node, x1, y1, x2, y2) {
            if (x1 > x3 || y1 > y3 || x2 < x0 || y2 < y0) return;

            if (point = node.point) {
                var point;
                var dx = x - node.x;
                var dy = y - node.y;
                var distance2 = dx * dx + dy * dy;

                if (distance2 < minDistance2) {
                    var distance = Math.sqrt(minDistance2 = distance2);
                    x0 = x - distance, y0 = y - distance;
                    x3 = x + distance, y3 = y + distance;
                    closestPoint = point;
                }
            }

            var children = node.nodes;
            var xm = (x1 + x2) * .5;
            var ym = (y1 + y2) * .5;
            var right = x >= xm;
            var below = y >= ym;

            for (var i = below << 1 | right, j = i + 4; i < j; ++i) {
                if (node = children[i & 3]) switch (i & 3) {
                    case 0: find(node, x1, y1, xm, ym); break;
                    case 1: find(node, xm, y1, x2, ym); break;
                    case 2: find(node, x1, ym, xm, y2); break;
                    case 3: find(node, xm, ym, x2, y2); break;
                }
            }
        })(root, x0, y0, x3, y3);

        return closestPoint;
    }

    //check if the edge intersects with the given node
    function intersects(edge, node, x1_, y1_, x2_, y2_) {
        // first test whether the segment bounding box is entirely contained
        // within the block.  If true, the segment is obviously inside the block
        // console.log(x1_,y1_,x2_,y2_);
        var esx = edge.source.x;    
        var esy = edge.source.y;
        var etx = edge.target.x;
        var ety = edge.target.y;
        var mx = (x1_ + x2_)*0.5;
        var my = (y1_ + y2_)*0.5;

        //checking if the block lies inside the current quadrant
        if( esx > x1_ && esx < x2_ && ety > y1_ && ety < y2_) {
            // does not intersect the bounding box as it completely lies inside it
            // console.log("return false");
            return false;
        } 
        
        // if segment bounding box is not entirely contained within the block, then
        // the segment itself must intersect with at least one of the four sides
        // of the block.  Otherwise, the segment and block do not intersect 

        // using parametric method to determine whether the two lines intersect
        var sNumer = (x1_ - x2_)*(y2_ - esy) - (x2_ - esx)*(y1_ - y2_);
        var sDenom = (x1_ - x2_)*(ety - esy) - (etx - esx)*(y1_ - y2_);
        var s = sNumer/sDenom;
        // if(s < 1) {
            // they intersect
        

        

    }

    function addEdge(root, x1_, y1_, x2_, y2_, edge) {
        //if(typeof root == "undefined") return false;
        // console.log(root, x1_,y1_,x2_,y2_);
        // console.log("adding edge to the quadtree");
        //check it the node intersects the edge
        //if yes
        if(intersects(edge, root, x1_,y1_,x2_,y2_)) {
            console.log("intersects bounding box");
            //find the leaf node to put the edge in
            //check if curr node is the leaf node
            if(root.leaf == true && root.nodes.length==0 && typeof root.point !== "undefined") {
                //put the edge here
                if(typeof root.edges == "undefined") root.edges = [];
                root.edges.push(edge);
                return true;
            } else {
                //recurse to a leaf node
                if(typeof root[0] !== "undefined")
                    addEdge(root[0], x1_, y1_, x2_, y2_, edge);
                if(typeof root[1] !== "undefined")
                    addEdge(root[1], x1_, y1_, x2_, y2_, edge);
                if(typeof root[2] !== "undefined")
                    addEdge(root[2], x1_, y1_, x2_, y2_, edge);
                if(typeof root[3] !== "undefined")
                    addEdge(root[3], x1_, y1_, x2_, y2_, edge);
                return true;
            }
        } else 
            return false;
        // if no
            // do nothing
    }

    var root = create();    //creates a node, as this is the first node for the constructor call, it's called the root

    // root.visit(callback) 
    // Visits each node in the quadtree, invoking the specified callback with arguments {node, x1, y1, x2, y2} for each node. Nodes are traversed in pre-order. If the callback returns true for a given node, then the children of that node are not visited; otherwise, all child nodes are visited.
    // x1_,y1 are lower bounds
    // x2_, y2_ are upper bounds
    root.visit = function(f)  {
        return visit(f, root, x1_, y1_, x2_, y2_);
    };
    root.find = function(x, y)  {return findNode(root, x, y, x1_, y1_, x2_, y2_);};

    // root.addEdge = function(edge) {return addEdge(root, x1_, y1_, x2_, y2_, edge);};

    for (i = 0; i < n; i++) insert(root, points[i], xs[i], ys[i], x1_, y1_, x2_, y2_);
    --i;
    
    // for (i = 0; i < edges.length; i++) addEdge(root, x1_, y1_, x2_, y2_, edges[i]);
    // --i;
    
    xs = ys = points = d = null;

    return root;
};