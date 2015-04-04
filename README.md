# LargeNetworkGraph
###Proposal Assignments completed

####Translated Mouse screen coordinated into modelview space	- ```Completed```


####Finding Nearest Node - ```Completed```


######	In the file ccNetViz.js, inside the function clicked(e) 

		```
		console.log(_node);
		```
#######	prints the nearest node


####	Adding all the edges to the Quadtree 	-	```Completed```

######	Inside the clicked(e) function in ccNetViz.js

		I have created a quadtree with given nodes and edges
		```
		quadTree = ccNetViz.quadtree(currentNodes, currentEdges);
		```

		```
		console.log("Quadtree is", quadTree); 
		```
######	logs out the quadtree structure, marked as RED in CONSOLE

		One can observe that ALL leaf nodes have the edges stored in them that pass through the leaf nodes


####	Finding nearest edge 


####	Logging out the nearest edge
