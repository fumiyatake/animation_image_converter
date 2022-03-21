'use strict';
const path = require( 'path' );

const IS_DEV    = process.env.NODE_ENV === 'develop';
const ROOT_DIR  = IS_DEV ? __dirname : path.join( process.resourcesPath, 'src' );
const BIN_DIR   = path.join( ROOT_DIR, 'bin' );

module.exports = Object.freeze({
    IS_DEV      : IS_DEV,
    ROOT_DIR    : ROOT_DIR,
    BIN_DIR     : BIN_DIR,
});