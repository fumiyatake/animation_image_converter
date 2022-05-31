'use strict';

const path = require( 'path' );
const { ipcRenderer, contextBridge } = require( 'electron' );
const { IS_DEV } = require( path.join( '..', 'main', 'config.js' ) );

contextBridge.exposeInMainWorld( 'myApi', {
    selectDirectory : async () => ipcRenderer.invoke( 'select-directory' ),
    convertAnimateImage : async function(){ return ipcRenderer.invoke( 'convert-animate-image', [...arguments] ); },
    showResult : async function(){ return ipcRenderer.invoke( 'show-result', [...arguments] ); }
} );

contextBridge.exposeInMainWorld( 'vars', {
    isDev   : IS_DEV,
    ds      : path.sep,
} );