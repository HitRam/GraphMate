const { app, BrowserWindow, Menu } = require('electron')
const path = require('path')
const url = require('url')
const ipc = require('electron').ipcMain

//global reference to window object
let win

function createWindow() {
  win = new BrowserWindow({width: 800, height: 600})

  win.loadURL(url.format({
	pathname: path.join(__dirname, 'src/index.html'),
	protocol: 'file:',
	slashes: true
  }))

  //open the devtools
  //remove this once in production mode
  win.webContents.openDevTools()

  win.on('closed', () => {
	win = null
  })
}

const menu_template = [{
	label: 'File',
	submenu: [{
		label: 'New'
	  },
	  {
		label: 'Open'
	  },
	  {
		label: 'Save'
	  },
	  {
		label: 'Save As'
	  },
	  {
		role: 'close'
	  },
	  {
		role: 'quit'
	  }
	]
  },
  {
	label: 'Edit',
	submenu: [{
		role: 'undo'
	  },
	  {
		role: 'redo'
	  },
	  {
		role: 'cut'
	  },
	  {
		role: 'copy'
	  },
	  {
		role: 'paste'
	  }
	]
  },

  {
	label: 'View',
	submenu: [{
		role: 'resetzoom'
	  },
	  {
		role: 'zoomin'
	  },
	  {
		role: 'zoomout'
	  },
	  {
		type: 'separator'
	  },
	  {
		role: 'togglefullscreen'
	  }
	]
  },

  {
	role: 'window',
	submenu: [{
		role: 'minimize'
	  },
	  {
		role: 'close'
	  }
	]
  },

  {
	role: 'help',
	submenu: [{
	  label: 'Learn More'
	}]
  }
]

const menu = Menu.buildFromTemplate(menu_template)
Menu.setApplicationMenu(menu)

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
	app.quit()
  }
})

app.on('activate', () => {
  if (win === null) {
	createWindow()
  }
})

ipc.on('draw-graph-main', function(event, arg) {
	win.webContents.send('draw-graph-index', arg);
})

ipc.on('close-subwindow', function(event, arg) {
	win.webContents.send('close-subwindow');
})
