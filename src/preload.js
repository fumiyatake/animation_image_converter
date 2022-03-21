'use strict';

const { ipcRenderer, contextBridge } = require( 'electron' );
const { convertList } = require('./animate_image_convert.js');

contextBridge.exposeInMainWorld( 'myApi', {
    selectDirectory : async () => ipcRenderer.invoke( 'select-directory' ),
    convertAnimateImage: convertList,
} );