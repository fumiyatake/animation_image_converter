'use strict';
const { app, BrowserWindow, ipcMain, dialog, shell, Notification } = require( 'electron' );
const path = require( 'path' );
const { IS_DEV } = require( './config.js' );
const { convert } = require('./animate_image_convert.js');

const createWindow = async () => {
    const mainWindow = new BrowserWindow({
        title: 'Animation Image Converter',
        webPreferences: {
            nodeIntegration: false,
            preload: path.join( __dirname, 'preload.js' ),
        }
    });
    mainWindow.maximize();

    // open devtool if env is develop
    if( IS_DEV ){
        mainWindow.webContents.openDevTools( { mode: 'right' } );
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
        const result = await convert( ..._arg );
        return result;
    });

    ipcMain.handle('show-result', async ( _e, _arg ) => {
        const [ outputDir, successCount, errorCount ] = _arg;
        const notice = new Notification( {
            title   : '[Animate Image Converter] Finished',
            body    : 'please check details.',
        } );
        notice.on( 'click', () => mainWindow.focus() );
        notice.show();

        const result = await dialog.showMessageBox( mainWindow, {
            title           : 'Finished',
            checkboxLabel   : 'open output folder',
            type            : errorCount > 0 ? 'error' : 'info',
            detail          : [
                'Process finished!',
                `  (success : ${successCount}, error ${errorCount}.)`,
                `${ errorCount > 0 ? 'please check error details at main window.' : ''}`,
            ].join( '\n' ),
            checkboxChecked : true,
            buttons         : [ 'OK' ],
        } );
        if( result.checkboxChecked ) await shell.openPath( outputDir );
    });

    mainWindow.loadFile( path.join( __dirname, 'public', 'index.html' ) );
}

app.once( 'ready', () => {
    createWindow();
} );

app.once( 'window-all-closed', () => app.quit() );
