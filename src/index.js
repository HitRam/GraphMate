const { remote } = require('electron')
const { Menu, MenuItem } = remote
const electron = require('electron')
const path = require('path')
const ipc = electron.ipcRenderer
const BrowserWindow = electron.remote.BrowserWindow
window.$ = window.jQuery = require('jquery');


var constants = require('./constants');
var Hashmap = require('hashmap');
var random = require('random-js')();

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

//To check node click for details-bar in contentClick
var details_bar = 0;

//Basic set up for Konva
var layer = new Konva.Layer();
var width = document.getElementById("workspace1").clientWidth;
var height = document.getElementById("workspace1").clientHeight;
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

//Generator buttons
var random_graph_btn = document.getElementById("random_graph");

function setDefaults() {
    if (is_selected_start_node) {
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

random_graph_btn.addEventListener('click', function() {
    random_graph_btn.classList.add("active");
    let win = new BrowserWindow({ alwaysOnTop: true, 
            width: 400, 
            height: 200});
    const loadpath = path.join('file://', __dirname, 'choose_graph.html');
    win.loadURL(loadpath);
    win.on('close', function() {
        win = null;
        random_graph_btn.classList.remove("active");
    })
    win.webContents.openDevTools()
    win.show()
});



/*
	Function - setNodeBlink
		It highlights the selected node. Enhances UX.
	
	Params - 
		circle: Konvajs object (node).
*/
function setNodeBlink(circle) {
    circle.on('mouseover', function(eve) {
        if (selected_tool == constants.DRAG_TOOL) {
            circle.draggable(true);
        }
        this.stroke('red');
        this.strokeWidth(1);
        var degree = 0;
        adj.forEach(function(edges, key) {
            if (key == circle.id)
                return;
            for (var i = 0; i < edges.length; ++i) {
                if (edges[i].start_id == circle.id || edges[i].end_id == circle.id) {
                    degree++;
                    continue;
                }
                edges[i].opacity(0.3);
                edges[i].stroke('grey');
            }
        });
        if (circle.name())
            document.getElementById("node_name_infobar").innerHTML = circle.name;
        else
            document.getElementById("node_name_infobar").innerHTML = "Node-" + circle.id;
        document.getElementById("degree_count").innerHTML = "Degree " + degree;
        map.forEach(function(val, key) {
            if (key == eve.target.id)
                return;
            if (is_selected_start_node && key == start_node.id)
                return;
            val.setFill('grey');
            val.opacity(0.5);
        });
        var adj_nodes = adj.get(circle.id);
        for (var i = 0; i < adj_nodes.length; ++i) {
            if (adj_nodes[i].start_id != circle.id)
                map.get(adj_nodes[i].start_id).opacity(1);
            if (adj_nodes[i].end_id != circle.id)
                map.get(adj_nodes[i].end_id).opacity(1);
        }
        layer.draw();
    });
    circle.on('mouseout', function(eve) {
        document.getElementById("node_name_infobar").innerHTML = "infobar";
        document.getElementById("degree_count").innerHTML = "Degree -" ;
        circle.draggable(false);
        if (!is_selected_start_node)
            this.setFill('black');
        this.stroke(null);
        this.strokeWidth(null);
        adj.forEach(function(edges, key) {
            if (key == circle.id)
                return;
            for (var i = 0; i < edges.length; ++i) {
                if (edges[i].start_id == circle.id || edges[i].end_id == circle.id)
                    continue;
                edges[i].opacity(1);
                edges[i].stroke('black');
            }
        });
        map.forEach(function(val, key) {
            if (key == eve.target.id)
                return;
            if (is_selected_start_node && key == start_node.id)
                return;
            val.setFill('black');
            val.opacity(1);
        });
        layer.draw();
    });
    circle.on('click', function(eve) {
        if (selected_tool == constants.DEFAULT_TOOL) {
            $('.details_sidebar').removeClass('dismiss').addClass('selected').show();
            if (circle.name())
                $('#node_name').val(circle.name());
            $('#node_id').val(circle.id);
            $('#node_posx').val(circle.x());
            $('#node_posy').val(circle.y());
            $('#node_color').val(circle.fill());
            $('#node_size').val(circle.radius());
            details_bar = 1;
        }
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
        for (var i = 0; i < edges.length; ++i) {
            var edge = edges[i];
            var other_node;
            if (edge.start_id != circle.id)
                other_node = map.get(edge.start_id);
            if (edge.end_id != circle.id)
                other_node = map.get(edge.end_id);
            if (other_node)
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
    for (var i = 0; i < edges.length; ++i)
        if (edges[i].start_id == v.id || edges[i].end_id == v.id)
            edge_count++;
    var edge;
    if (edge_count > 0) {
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
    } else {
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

/*
    Function - drawRandomGraph
        Draws a random graph with default parameters

    Params - 
        n: number of nodes
        m: number of edges
*/
function drawRandomGraph(n, m) {
    map.clear();
    adj.clear();
    for(var i = 0; i < parseInt(n); ++i) {
        var x = random.real(1.0, width);
        var y = random.real(1.0, height);
        createNode(x, y);
    }
    var curr = 0;
    while(curr != parseInt(m)) {
        var u = random.integer(0, n - 1);
        var v = random.integer(0, n - 1);
        console.log(u);
        if(u == v)
            continue;
        var edges = adj.get(u);
        console.log(edges.length);
        var flag = true;
        for(var i = 0; i < edges.length; ++i) {
            if(edges[i].start_id == v || edges[i].end_id == v) {
                flag = false;
                break;
            }
        }
        if(!flag)
            continue;
        createEdge(map.get(u), map.get(v));
        curr++;
    }
}

stage.on('contentClick', function(event) {
    if (details_bar == 0) {
        if ($('.details_sidebar').hasClass('selected')) {
            $('.details_sidebar').removeClass('selected').addClass('dismiss');
            setTimeout(function() { $('.details_sidebar').hide() }, 500);

        }
    }
    details_bar = 0;
    switch (selected_tool) {

        //Add node tool functionality
        case constants.ADD_NODE_TOOL:
            var pos = stage.getPointerPosition();
            createNode(pos.x, pos.y);
            break;
    }
});

stage.on('click', function(event) {
    switch (selected_tool) {
        //Add edge tool functionality
        case constants.ADD_EDGE_TOOL:
            if (!is_selected_start_node) {
                is_selected_start_node = true;
                start_node = event.target;
                start_node.setFill('red');
                layer.draw();
            } else {
                is_selected_start_node = false;
                end_node = event.target;
                createEdge(start_node, end_node);
            }
            break;
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

ipc.on('draw-graph-index', function(event, arg) {
    drawRandomGraph(arg.num_nodes, arg.num_edges);
})



