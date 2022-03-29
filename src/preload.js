'use strict';

const { ipcRenderer, contextBridge } = require( 'electron' );

contextBridge.exposeInMainWorld( 'myApi', {
    selectDirectory : async () => ipcRenderer.invoke( 'select-directory' ),
    convertAnimateImage : async function(){ return ipcRenderer.invoke( 'convert-animate-image', [...arguments] ); },
} );