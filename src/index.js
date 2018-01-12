const { remote } = require('electron')
const { Menu, MenuItem } = remote

var constants = require('./constants');
var Hashmap = require('hashmap');

//Unique id for node
var node_id = 0;

//Number of edges
var num_edges = 0;

//Hashmap to map node id with canvas object
var map = new Hashmap();

//Adjacency list
var adj = new Hashmap();

//Variable to store the selected tool
//Default - Normal Selection
var selected_tool = constants.DEFAULT_TOOL;

//variables for tools functionalities
var is_selected_start_node = false;
var start_node;
var end_node;

//Basic set up for Konva
var layer = new Konva.Layer();
var width = window.innerWidth;
var height = window.innerHeight;
var stage = new Konva.Stage({
	container: 'workspace1',
	width: width,
	height: height
});

//Toolbar buttons
var normal_tool_btn = document.getElementById("normal_selection");
var add_node_tool_btn = document.getElementById("add_node");
var add_edge_tool_btn = document.getElementById("add_edge");
var drag_tool_btn = document.getElementById("drag");

function setDefaults() {
	if(is_selected_start_node) {
		start_node.setFill('black');
		layer.draw();
	}
	is_selected_start_node = false;
	start_node = null;
	end_node = null;
}

normal_tool_btn.addEventListener('click', function() {
	var prev_tool_btn = document.getElementById(selected_tool);
	prev_tool_btn.classList.remove("active");
	selected_tool = constants.DEFAULT_TOOL;
	normal_tool_btn.classList.add("active");
	document.getElementById("tool_name").innerHTML = "Selection";
	setDefaults();
});

add_node_tool_btn.addEventListener('click', function() {
	var prev_tool_btn = document.getElementById(selected_tool);
	prev_tool_btn.classList.remove("active");
	selected_tool = constants.ADD_NODE_TOOL;
	add_node_tool_btn.classList.add("active");
	document.getElementById("tool_name").innerHTML = "Add Node";
	setDefaults();
});

add_edge_tool_btn.addEventListener('click', function() {
	var prev_tool_btn = document.getElementById(selected_tool);
	prev_tool_btn.classList.remove("active");
	selected_tool = constants.ADD_EDGE_TOOL;
	add_edge_tool_btn.classList.add("active");
	document.getElementById("tool_name").innerHTML = "Add Edge";
	setDefaults();
});

drag_tool_btn.addEventListener('click', function() {
	var prev_tool_btn = document.getElementById(selected_tool);
	prev_tool_btn.classList.remove("active");
	selected_tool = constants.DRAG_TOOL;
	drag_tool_btn.classList.add("active");
	document.getElementById("tool_name").innerHTML = "Drag";
	setDefaults();
});

/*
	Function - setNodeBlink
		It highlights the selected node. Enhances UX.
	
	Params - 
		circle: Konvajs object (node).
*/
function setNodeBlink(circle) {
	circle.on('mouseover', function(eve) {
		if(selected_tool == constants.DRAG_TOOL) {
			circle.draggable(true);
		}
		this.stroke('red');
		this.strokeWidth(1);
		adj.forEach(function(edges, key) {
			if(key == circle.id) 
				return;
			for(var i = 0; i < edges.length; ++i) {
				if(edges[i].start_id == circle.id || edges[i].end_id == circle.id)
					continue;
				edges[i].opacity(0.3);
				edges[i].stroke('grey');
			}
		});
		if(circle.name())
			document.getElementById("node_name").innerHTML = circle.name;
		else
			document.getElementById("node_name").innerHTML = "Node-" + circle.id;
		map.forEach(function(val, key) {
			if(key == eve.target.id)
				return;
			if(is_selected_start_node && key == start_node.id)
				return;
			val.setFill('grey');
			val.opacity(0.5);
		});
		var adj_nodes = adj.get(circle.id);
		for(var i = 0; i < adj_nodes.length; ++i) {
			if(adj_nodes[i].start_id != circle.id)
				map.get(adj_nodes[i].start_id).opacity(1);
			if(adj_nodes[i].end_id != circle.id)
				map.get(adj_nodes[i].end_id).opacity(1);
		}
		layer.draw();
	});
	circle.on('mouseout', function(eve) {
		document.getElementById("node_name").innerHTML = "infobar"
		circle.draggable(false);
		if(!is_selected_start_node)
			this.setFill('black');
		this.stroke(null);
		this.strokeWidth(null);
		adj.forEach(function(edges, key) {
			if(key == circle.id) 
				return;
			for(var i = 0; i < edges.length; ++i) {
				if(edges[i].start_id == circle.id || edges[i].end_id == circle.id)
					continue;
				edges[i].opacity(1);
				edges[i].stroke('black');
			}
		});
		map.forEach(function(val, key) {
			if(key == eve.target.id)
				return;
			if(is_selected_start_node && key == start_node.id)
				return;
			val.setFill('black');
			val.opacity(1);
		});
		layer.draw();
	});
}

/*
	Function - updateEdgePosition 
		Updates the position of edges when node is dragged

	Params - 
		circle: Konvajs object

*/
function updateEdgePosition(circle) {
	circle.on('dragmove', function(event) {
		var edges = adj.get(circle.id);
		for(var i = 0; i < edges.length; ++i) {
			var edge = edges[i];
			var other_node;
			if(edge.start_id != circle.id)
				other_node = map.get(edge.start_id);
			if(edge.end_id != circle.id)
				other_node = map.get(edge.end_id);
			if(other_node)
				edge.points([circle.x(), circle.y(), other_node.x(), other_node.y()]);
		}
		layer.draw();
	})
}

/* 
	Function - createNode
		Creates nodes at specified position.

	Params - 
		x: x coordinate of node
		y: y coordinate of node
		size (optional): size of node. 
		color (optional): color of node.

*/
function createNode(x, y, 
	size = constants.DEFAULT_NODE_SIZE, 
	color = constants.DEFAULT_NODE_COLOR) {

	var circle = new Konva.Circle({
		x: x,
		y: y,
		radius: size,
		fill: color
	});

	circle.id = node_id;
	map.set(node_id, circle);
	adj.set(node_id, []);
	layer.add(circle).draw();
	setNodeBlink(circle);
	updateEdgePosition(circle);
	node_id++;

	document.getElementById("node_count").innerHTML = "Nodes " + String(adj.size) + ",";
}

/*
	Function - createEdge
		Creates an edge between node u and node v.

	Params -
		u: start node
		v: end node
		type(optional): Directed / Undirected
		weight(optional): weight of edge
		color(optional): color of edge
		size(optional): stroke width of edge

*/
function createEdge(u, v, 
	type = constants.DEFAULT_EDGE_TYPE, 
	weight = constants.DEFAULT_EDGE_WEIGHT, 
	color = constants.DEFAULT_EDGE_COLOR,
	size = constants.DEFAULT_EDGE_SIZE) {

	var edge_count = 0;
	var edges = adj.get(u.id);
	for(var i = 0; i < edges.length; ++i)
		if(edges[i].start_id == v.id || edges[i].end_id == v.id)
			edge_count++;
	var edge;
	if(edge_count > 0) {
		return;
		// var dx = (u.x() + v.x()) / 2.0 + 30.0;
		// var dy = (u.y() + v.y()) / 2.0;
		// edge = new Konva.Shape({
		// 	sceneFunc: function(context) {
		// 		context.beginPath();
		// 		context.moveTo(u.x(), u.y());
		// 		context.quadraticCurveTo(dx, dy, v.x(), v.y());
		// 		context.fillStrokeShape(this);
		// 	},
		// 	stroke: color,
		// 	strokeWidth: size,
		// 	type: 'cuved'
		// })
	}
	else {
		num_edges++;
		edge = new Konva.Line({
			points: [u.x(), u.y(), v.x(), v.y()],
			stroke: color,
			strokeWidth: size,
			type: 'straight'
		});
	}
	edge.start_id = u.id;
	edge.end_id = v.id;
	adj.get(u.id).push(edge);
	adj.get(v.id).push(edge);
	u.setFill('black');
	layer.add(edge);
	layer.draw();
	u.moveToTop();
	v.moveToTop();
	document.getElementById("edge_count").innerHTML = "Edges " + String(num_edges);

}

stage.on('contentClick', function(event) {
	switch(selected_tool) {

		//Add node tool functionality
		case constants.ADD_NODE_TOOL:
			var pos = stage.getPointerPosition();
			createNode(pos.x, pos.y);
			break;
	}
});

stage.on('click', function(event) {
	switch(selected_tool) {
		//Add edge tool functionality
		case constants.ADD_EDGE_TOOL:
			if(!is_selected_start_node) {
				is_selected_start_node = true;
				start_node = event.target;
				start_node.setFill('red');
				layer.draw();
			}
			else {
				is_selected_start_node = false;
				end_node = event.target;
				createEdge(start_node, end_node);
			}
	}
});

stage.add(layer);

// stage.add(layer);

//Menu Bar at top
const menu = new Menu()

// Build menu one item at a time, unlike
menu.append(new MenuItem({
    label: 'MenuItem1',
    click() {
        console.log('item 1 clicked')
    }
}))

menu.append(new MenuItem({ type: 'separator' }))
menu.append(new MenuItem({ label: 'MenuItem2', type: 'checkbox', checked: true }))
menu.append(new MenuItem({
    label: 'MenuItem3',
    click() {
        console.log('item 3 clicked')
    }
}))

// Prevent default action of right click in chromium. Replace with our menu.
window.addEventListener('contextmenu', (e) => {
        e.preventDefault()
        menu.popup(remote.getCurrentWindow())
    }, false) 

//End Menu Bar