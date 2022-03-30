'use strict';
const { app, BrowserWindow, ipcMain, dialog, shell } = require( 'electron' );
const path = require( 'path' );
const { IS_DEV } = require( './config.js' );
const { convertList } = require('./animate_image_convert.js');

const createWindow = () => {
    const mainWindow = new BrowserWindow({
        width: 600,
        height: 400,
        title: 'Animation Image Converter',
        webPreferences: {
            nodeIntegration: false,
            preload: path.join( __dirname, 'preload.js' ),
        }
    });

    // open devtool if env is develop
    if( IS_DEV ){
        mainWindow.webContents.openDevTools( { mode: 'detach' } );
    }
    
    ipcMain.handle('select-directory', async ( _e, _arg ) =>{
        return dialog
            .showOpenDialog( mainWindow, {
                properties: ['openDirectory', 'multiSelections'],
            } )
            .then( result => {
                if( result.canceled ) return [];
                return result.filePaths;
            } );
    });

    ipcMain.handle('convert-animate-image', async ( _e, _arg ) => {
        const result = await convertList( ..._arg );
        shell.openPath( result.output );
        return result;
    });

    mainWindow.loadFile( path.join( __dirname, 'public', 'index.html' ) );
}

app.once( 'ready', () => {
    createWindow();
} );

app.once( 'window-all-closed', () => app.quit() );
