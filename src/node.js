/*
	Properties of node are defined by this function
*/
module.exports = function Node(id, name=constants.DEFAULT_NODE_NAME, color=constants.DEFAULT_NODE_COLOR, shape=constants.DEFAULT_NODE_SHAPE, size=constants.DEFAULT_SIZE) {
	this.id = id;
	this.name = name;
	this.color = color;
	this.shape = shape;
	this.size = size;
}