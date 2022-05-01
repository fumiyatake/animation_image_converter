'use strict';
const { app, BrowserWindow, ipcMain, dialog, shell, Notification } = require( 'electron' );
const path = require( 'path' );
const { IS_DEV, SRC_DIR } = require( './config.js' );
const settings = require( './settings.js' );
const { convert } = require('./animate_image_convert.js');

const createWindow = async () => {
    const mainWindow = new BrowserWindow({
        title: 'Animation Image Converter',
        webPreferences: {
            nodeIntegration: false,
            preload: path.join( SRC_DIR, 'renderer', 'preload.js' ),
        }
    });
    const { isMaximized, bounds } = settings.get( 'isMaximized', 'bounds' );
    if( isMaximized || bounds === null ){
        mainWindow.maximize();
    }else{
        mainWindow.setBounds( bounds );
    }

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
            title   : '[Animate Image Converter] 変換完了',
            body    : '結果詳細を確認してください',
        } );
        notice.on( 'click', () => mainWindow.focus() );
        notice.show();

        const result = await dialog.showMessageBox( mainWindow, {
            title           : '変換完了',
            checkboxLabel   : '出力先フォルダを開く',
            type            : errorCount > 0 ? 'error' : 'info',
            detail          : [
                '変換が完了しました。',
                `  (成功 : ${successCount}件, 失敗 ${errorCount}件.)`,
                `${ errorCount > 0 ? 'メイン画面に表示されているエラー文言を確認してください。' : ''}`,
            ].join( '\n' ),
            checkboxChecked : true,
            buttons         : [ 'OK' ],
        } );
        if( result.checkboxChecked ) await shell.openPath( outputDir );
    });

    mainWindow.loadFile( path.join( SRC_DIR, 'renderer', 'index.html' ) );

    mainWindow.on( 'close', () => {
        settings.set( {
            isMaximized : mainWindow.isMaximized(),
            bounds      : mainWindow.getBounds(),
        });
    });
}

app.once( 'ready', () => {
    createWindow();
} );

app.once( 'window-all-closed', () => app.quit() );
