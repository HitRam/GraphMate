const { remote } = require('electron')
const { Menu, MenuItem } = remote

var constants = require('./constants');
var Hashmap = require('hashmap');

//Unique id for node
var node_id = 0;

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
	setDefaults();
});

add_node_tool_btn.addEventListener('click', function() {
	var prev_tool_btn = document.getElementById(selected_tool);
	prev_tool_btn.classList.remove("active");
	selected_tool = constants.ADD_NODE_TOOL;
	add_node_tool_btn.classList.add("active");
	setDefaults();
});

add_edge_tool_btn.addEventListener('click', function() {
	var prev_tool_btn = document.getElementById(selected_tool);
	prev_tool_btn.classList.remove("active");
	selected_tool = constants.ADD_EDGE_TOOL;
	add_edge_tool_btn.classList.add("active");
	setDefaults();
});

//It highlights the selected node. 
//Enhances UX.
function setNodeBlink(circle) {
	circle.on('mouseover', function(eve) {
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

stage.on('contentClick', function(event) {
	switch(selected_tool) {

		//Add node tool functionality
		case constants.ADD_NODE_TOOL:
			var pos = stage.getPointerPosition();
			var circle = new Konva.Circle({
				x: pos.x,
				y: pos.y,
				radius: constants.DEFAULT_NODE_SIZE,
				fill: constants.DEFAULT_NODE_COLOR
			});

			circle.id = node_id;
			map.set(node_id, circle);
			adj.set(node_id, []);
			layer.add(circle).draw();
			setNodeBlink(circle);
			node_id++;
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
				var edge = new Konva.Line({
					points: [start_node.x(), start_node.y(), end_node.x(), end_node.y()],
					stroke: 'black',
					strokeWidth: 0.5,
				});
				edge.start_id = start_node.id;
				edge.end_id = end_node.id;
				adj.get(start_node.id).push(edge);
				adj.get(end_node.id).push(edge);
				start_node.setFill('black');
				layer.add(edge);
				layer.draw();
				start_node.moveToTop();
				end_node.moveToTop();
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