'use strict';

const { ipcRenderer, contextBridge } = require( 'electron' );
const { IS_DEV } = require( './config.js' );

contextBridge.exposeInMainWorld( 'myApi', {
    selectDirectory : async () => ipcRenderer.invoke( 'select-directory' ),
    convertAnimateImage : async function(){ return ipcRenderer.invoke( 'convert-animate-image', [...arguments] ); },
    showResult : async function(){ console.log(arguments);return ipcRenderer.invoke( 'show-result', [...arguments] ); }
} );

contextBridge.exposeInMainWorld( 'vars', {
    isDev   : IS_DEV,
    ds      : ( process.platform === 'win32' ) ? '\\' : '/',
} );