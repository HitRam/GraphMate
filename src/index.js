const { remote } = require('electron')
const { Menu, MenuItem } = remote

var constants = require('./constants');
var Hashmap = require('hashmap');

//Unique id for node
var node_id = 0;

//Hashmap to map node id with canvas object
var map = new Hashmap();

//Variable to store the selected tool
//Default - Normal Selection
var selected_tool = constants.DEFAULT_TOOL;

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

normal_tool_btn.addEventListener('click', function() {
	var prev_tool_btn = document.getElementById(selected_tool);
	prev_tool_btn.classList.remove("active");
	selected_tool = constants.DEFAULT_TOOL;
	normal_tool_btn.classList.add("active");
});

add_node_tool_btn.addEventListener('click', function() {
	var prev_tool_btn = document.getElementById(selected_tool);
	prev_tool_btn.classList.remove("active");
	selected_tool = constants.ADD_NODE_TOOL;
	add_node_tool_btn.classList.add("active");
});

add_edge_tool_btn.addEventListener('click', function() {
	var prev_tool_btn = document.getElementById(selected_tool);
	prev_tool_btn.classList.remove("active");
	selected_tool = constants.ADD_EDGE_TOOL;
	add_edge_tool_btn.classList.add("active");
});


//It highlights the selected node. 
//Enhances UX.
function setNodeBlink(circle) {
	circle.on('mouseover', function(eve) {
		this.stroke('red');
		this.strokeWidth(1);
		map.forEach(function(val, key) {
			if(key == eve.target.id)
				return;
			val.setFill('grey');
			val.opacity(0.5);
		});
		layer.draw();
	});
	circle.on('mouseout', function(eve) {
		this.setFill('black');
		this.stroke(null);
		this.strokeWidth(null);
		map.forEach(function(val, key) {
			if(key == eve.target.id)
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
			layer.add(circle).draw();
			setNodeBlink(circle);
			node_id++;
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