const electron = require('electron')
const path = require('path')
const remote = electron.remote
const ipc = electron.ipcRenderer

var close_btn = document.getElementById("close_btn");
var ok_btn = document.getElementById("ok_btn");

close_btn.addEventListener('click', function() {
	var win = remote.getCurrentWindow();
	ipc.send("close-subwindow");
	win.close();
});

ok_btn.addEventListener('click', function() {
	var info = {num_nodes: 0, num_edges: 0};
	info.num_nodes = document.getElementById("num_nodes").value;
	info.num_edges = document.getElementById("num_edges").value;

	if(num_nodes == null || num_nodes == null || num_nodes < 0 || num_edges < 0) {
		//error handling
	}

	else {
		//sends the variable to main process which sends it to another renderer process (index.js)
		ipc.send("draw-graph-main", info);
		var win = remote.getCurrentWindow();
		win.close();
	}
})