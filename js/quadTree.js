ccNetViz.quadtree = function(points, edges) {
    // console.log(" Quadtree constructor called");
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
    var dx = x2_ - x1_; //difference between postive and negative infinites
    var dy = y2_ - y1_;
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


    // findNode(root, x, y, x1_, y1_, x2_, y2_)
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
        //middle point of y-axis
        var mx = (x1_ + x2_)*0.5;
        //middle point of x-axis
        var my = (y1_ + y2_)*0.5;        
        
        //checking if the block lies inside the current quadrant
        // if( esx >= x1_ && esx <= x2_ && ety >= y1_ && ety <= y2_) {
        //     // does not intersect the bounding box as it completely lies inside it
        //     console.log("%c NOT intersects because edge is entirely contained within the quadrant", 'background: yellow; color: red');
        //     return false;
        // } 
        // //if both the source and taget nodes lie outside the bounding box
        // if(((esx > x2_ && esy > y2_) || (esx < x1_ && esy < y1_))) {
        //     if(((etx > x2_ && ety > y2_) || (etx < x1_ && ety < y1_))) {
        //         console.log("%c NOT intersects because edge is entirely outside the quadrant", 'background: yellow; color: red');
        //         return false;
        //     }
        // }
        
        // if segment bounding box is not entirely contained within the block, then
        // the segment itself must intersect with at least one of the four sides
        // of the block.  Otherwise, the segment and block do not intersect 

        // using parametric method to determine which edge the line segment intersects

        // var sNumer = (x1_ - x2_)*(y2_ - esy) - (x2_ - esx)*(y1_ - y2_);
        // var sDenom = (x1_ - x2_)*(ety - esy) - (etx - esx)*(y1_ - y2_);
        // var s = sNumer/sDenom;
        // if(s < 1) {
        //     // they intersect
        //     console.log("%c intersects", 'background: yellow; color: red');
        //     return true;
        // } else {
        //     //this means that the extended line segments intersect, which we don't consider
        //     console.log("%c NOT intersects", 'background: yellow; color: red');
        //     return false;
        // }
        
        var sourceOutcode, targetOutcode;
        var b1,b2,b3,b4;
        // compute outcodes for both the end points
        sourceOutcode = computeOutcode(edge.source, x1_, y1_, x2_, y2_);
        targetOutcode = computeOutcode(edge.target, x1_, y1_, x2_, y2_);
        // console.log(sourceOutcode);
        // console.log(targetOutcode);

        //if both the nodes are inside the bounding box
        if(sourceOutcode == 0000 && targetOutcode == 0000) {
            // console.log("%c NOT intersects because edge is entirely inside the quadrant", 'background: yellow; color: red');
            // console.log('(',esx,esy,')','(',etx,ety,')', x1_, y1_, x2_,y2_);
            return false;
        } else if((sourceOutcode[0] == 1 && targetOutcode[0] == 1) || 
                (sourceOutcode[1] == 1 && targetOutcode[1] == 1) ||
                (sourceOutcode[2] == 1 && targetOutcode[2] == 1) ||
                (sourceOutcode[3] == 1 && targetOutcode[3] == 1)) {
            // console.log("%c NOT intersects because edge is entirely outside the quadrant, and does not intersect any edge", 'background: yellow; color: red');
            // console.log('(',esx,esy,')','(',etx,ety,')', x1_, y1_, x2_,y2_);
            return false;
        } else {
            //clipping the line segment
            // pick one node that lies outside the bounding box
            // console.log("%c segment intersects the edge", 'background: green; color: white');
            // console.log(sourceOutcode);
            // console.log(targetOutcode);
            var outsideTempNode, insideTempNode;
            var codeOut;
            if(sourceOutcode == 0000) {
                codeOut = targetOutcode;
                outsideTempNode = edge.target;
                insideTempNode = edge.source;
            }
            else {
                codeOut = sourceOutcode;
                outsideTempNode = edge.source;
                insideTempNode = edge.target;
            } 

            var intersectionPointCoord = {};
            var flag = false;
            //find out the intersection point on the edge
            //if the node selected is above the top edge
            if(codeOut[0] == 1 && flag == false) {
                intersectionPointCoord.x = outsideTempNode.x + (y2_ - outsideTempNode.y) * ((insideTempNode.x - outsideTempNode.x) / (insideTempNode.y - outsideTempNode.y));
                intersectionPointCoord.y = y2_;
                if(!intersectsExtension(intersectionPointCoord, x1_,y1_,x2_,y2_, outsideTempNode, insideTempNode)) flag = true;
            } 
            //if the node selected is below the bottom edge
            if(codeOut[1] == 1 && flag == false){
                intersectionPointCoord.x = outsideTempNode.x + (y1_ - outsideTempNode.y) * ((insideTempNode.x - outsideTempNode.x) / (insideTempNode.y - outsideTempNode.y));
                intersectionPointCoord.y = y1_;
                if(!intersectsExtension(intersectionPointCoord, x1_,y1_,x2_,y2_, outsideTempNode, insideTempNode)) flag = true;
            }
            //if the node selected is right of the right edge
            if(codeOut[2] == 1 && flag == false){
                intersectionPointCoord.y = outsideTempNode.y + (x2_ - outsideTempNode.x) * ((insideTempNode.y - outsideTempNode.y) / (insideTempNode.x - outsideTempNode.x));
                intersectionPointCoord.x = x2_;
                if(!intersectsExtension(intersectionPointCoord, x1_,y1_,x2_,y2_, outsideTempNode, insideTempNode)) flag = true;
            }
            //if the node selected is left of the left edge
            if(codeOut[3] == 1 && flag == false){
                intersectionPointCoord.y = outsideTempNode.y + (x1_ - outsideTempNode.x) * ((insideTempNode.y - outsideTempNode.y) / (insideTempNode.x - outsideTempNode.x));
                intersectionPointCoord.x = x1_;
                if(!intersectsExtension(intersectionPointCoord, x1_,y1_,x2_,y2_, outsideTempNode, insideTempNode)) flag = true;
            }
            // console.log('(', outsideTempNode.x,outsideTempNode.y,')', '(', insideTempNode.x,insideTempNode.y,')', '(',x1_,y1_,')', '(',x2_,y2_,')');
            // console.log('(', intersectionPointCoord.x,intersectionPointCoord.y,')');
            // if(intersectionPointCoord.y > y2_ || intersectionPointCoord.y < y1_ || intersectionPointCoord.x < x1_ || intersectionPointCoord.x > x2_) {
            //     console.info('(', outsideTempNode.x, outsideTempNode.y,')', '(', insideTempNode.x,insideTempNode.y,')', '(',x1_,y1_,')', '(',x2_,y2_,')');
            //     console.info('(', intersectionPointCoord.x,intersectionPointCoord.y,')');
            //     return false;
            // }
            return flag;
            // computeOutcode(intersectionPointCoord, x1_,y1_,x2_,y2_);

        }


        // b4 == 1 for both OR
        // b3 == 1 for both OR


    }

    function intersectsExtension(intersectionPointCoord, x1_,y1_,x2_,y2_, outsideTempNode, insideTempNode) {
        if(intersectionPointCoord.y > y2_ || intersectionPointCoord.y < y1_ || intersectionPointCoord.x < x1_ || intersectionPointCoord.x > x2_) {
            // console.info('(', outsideTempNode.x, outsideTempNode.y,')', '(', insideTempNode.x,insideTempNode.y,')', '(',x1_,y1_,')', '(',x2_,y2_,')');
            // console.info('%c intersection outside', 'background:red; color:white', '(', intersectionPointCoord.x,intersectionPointCoord.y,')');
            //intersection point lies outside the bounding box
            return true;
        } else {
            // console.info('(', outsideTempNode.x, outsideTempNode.y,')', '(', insideTempNode.x,insideTempNode.y,')', '(',x1_,y1_,')', '(',x2_,y2_,')');
            // console.info('%c intersection inside', 'background:blue; color:white', '(', intersectionPointCoord.x,intersectionPointCoord.y,')');
            return false;
        }
        //intersection point lies inside/on the bounding box
    }

    function computeOutcode(point, x1_, y1_, x2_, y2_) {
        var b1 = 0, //above top edge
            b2 = 0, //below bottom edge
            b3 = 0, //right of right edge
            b4 = 0; //left of left edge
        if(point.x < x1_) {
            b4 = 1;
        } else if(point.x > x2_) {
            b3 = 1;
        } else {
            b3 = b4 = 0;
        }

        if(point.y < y1_) {
            b2 = 1;
        } else if(point.y > y2_) {
            b1 = 1;
        } else {
            b1 = b2 = 0;
        }
        return (b1 + '' + b2 + '' + b3 + '' + b4);
    }

    function addEdge(root, x1_, y1_, x2_, y2_, edge) {
        // console.log("adding edge", edge.source.label, edge.target.label);
        //if(typeof root == "undefined") return false;
        //check it the node intersects the edge
        // if no
            // do nothing
        if(!intersects(edge, root, x1_,y1_,x2_,y2_)) {
            return false;
        } else {
        //if yes
            //find the leaf node to put the edge in
            //check if curr node is the leaf node
            // if(root.leaf == true && root.nodes.length==0 && typeof root.point !== "undefined") {
            if(root.leaf == true && root.nodes.length==0) {
                //put the q-edge here
                if(typeof root.QEdges == "undefined") root.QEdges = [];
                root.QEdges.push(edge);
                return true;
                // console.log("%c Edge added", 'background: blue; color: white');
                // return;
                // if(root.point == null) {
                //     // console.log("%c Source:", 'background: red; color: white', edge.source.label, "Target:", edge.target.label, 'to node --->NULL', x1_,y1_,x2_,y2_);
                // } else {
                //     // console.log("%c Source:", 'background: orange; color: white', edge.source.label, "Target:", edge.target.label, 'to node --->', root.point.label);
                // }
            } else {
                if(typeof root.nodes[0] == "undefined") {
                    root.nodes[0] = create();
                }
                if(typeof root.nodes[1] == "undefined") {
                    root.nodes[1] = create();
                }
                if(typeof root.nodes[2] == "undefined") {
                    root.nodes[2] = create();
                }
                if(typeof root.nodes[3] == "undefined") {
                    root.nodes[3] = create();
                }
                return false;
            }

            //if it is not a leaf node, then it'll contain 4 quadrants.
            //create child nodes if they don't exist
            
        }
    }

    function sqr(x) { return x * x }
    
    function dist2(v, w) { return sqr(v.x - w.x) + sqr(v.y - w.y) }
    
    function distToSegmentSquared(p, v, w) {
      var l2 = dist2(v, w);
      if (l2 == 0) return dist2(p, v);
      var t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
      if (t < 0) return dist2(p, v);
      if (t > 1) return dist2(p, w);
      return dist2(p, { x: v.x + t * (w.x - v.x),
                        y: v.y + t * (w.y - v.y) });
    }
    
    function distToSegment(p, v, w) { return Math.sqrt(distToSegmentSquared(p, v, w)); }

    var root = create();    //creates a node, as this is the first node for the constructor call, it's called the root

    // root.visit(callback) 
    // Visits each node in the quadtree, invoking the specified callback with arguments {node, x1, y1, x2, y2} for each node. Nodes are traversed in pre-order. If the callback returns true for a given node, then the children of that node are not visited; otherwise, all child nodes are visited.
    // x1_,y1 are lower bounds
    // x2_, y2_ are upper bounds
    root.visit = function(f)  {
        return visit(f, root, x1_, y1_, x2_, y2_);
    };
    root.find = function(x, y)  {return findNode(root, x, y, x1_, y1_, x2_, y2_);};

    //currently, it only returns the closest edge in the leaf node that contains the point of interest
    // TODO : compare with edges in the adjacent quadrants/nodes too
    root.findEdge = function(x,y) {
        var closestEdgeFinal = null;
        visit(function(node, x1_, y1_, x2_, y2_) {
            var point = {};
            point.x = x;
            point.y = y;
            var outCode = computeOutcode(point, x1_,y1_,x2_,y2_);
            //if the point lies INSIDE the current node
            if(outCode == 0) {
                //find all the edges stored in this node
                if(typeof node.QEdges !== "undefined") {
                    //find the closest edge
                    var minDistance = Infinity, closestEdge;
                    for (var i = node.QEdges.length - 1; i >= 0; i--) {
                        var tempDistance;
                        tempDistance = distToSegment({x:x, y:y}, node.QEdges[i].source, node.QEdges[i].target);
                        if(tempDistance < minDistance) {
                            minDistance = tempDistance;
                            closestEdge = node.QEdges[i];
                        }
                    };
                    closestEdgeFinal = closestEdge;
                    return true;
                } else {
                    //traverse child nodes
                    return false;
                }
            } else {
                //don't traverse root's children
                return true;
            }
        },root, x1_, y1_, x2_, y2_);
        return closestEdgeFinal;
    };

    for (i = 0; i < n; i++) insert(root, points[i], xs[i], ys[i], x1_, y1_, x2_, y2_);
    --i;

    function normalizeNodes(root) {
        if(typeof root == "undefined") return;
        if(root.leaf == false) {
            
            //for the visit function to truly visit ALL nodes, we have to ensure that the NODES exist
            // In the D3 implementation of the quadtree, if a node was divided, nodes were created ONLY if they had a point in them
            // This means that if in a quadrant, there were 2 points, only two nodes were created and were indexed.
            //What this function does is it creates other nodes as well, and marks them as leaf nodes with NO point inside.
            //This will ensure that QE-Edges can be added to nodes that don't have any point inside them

            //find out what nodes are missing and add them as leaf nodes with null points
            // console.log("add here");
            var skip = [false,false,false,false];
            if(typeof root.nodes[0] == "undefined") {
                root.nodes[0] = create();
                skip[0] = true;
            }
            if(typeof root.nodes[1] == "undefined") {
                root.nodes[1] = create();
                skip[1] = true;
            }
            if(typeof root.nodes[2] == "undefined") {
                root.nodes[2] = create();
                skip[2] = true;
            }
            if(typeof root.nodes[3] == "undefined") {
                root.nodes[3] = create();
                skip[3] = true;
            }
            for (var i = 3 ; i >= 0; i--) {
                if(!skip[i]) normalizeNodes(root.nodes[i]);
            };

        } else {
            return;
        }
    }

    if(typeof edges !== "undefined") {
        // normalizeNodes(root);
        for (i = 0; i < edges.length; i++) {
            visit(function(node, x1_, y1_, x2_, y2_) {
                // console.log("first do this", node, x1_, y1_, x2_, y2_);
                return addEdge(node, x1_, y1_, x2_, y2_, edges[i]);
            }, root, x1_, y1_, x2_, y2_);
        }
        --i;
    }
    
    xs = ys = points = d = null;

    return root;
};