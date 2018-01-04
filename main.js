const {app, BrowserWindow, Menu} = require('electron')
const path = require('path')
const url = require('url')

//global reference to window object
let win

function createWindow () {
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