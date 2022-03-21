'use strict';

const path = require( 'path' );
const { exec } = require('child_process');
const { readdir, mkdir, stat } = require('fs').promises;
const { BIN_DIR } = require( './config.js' );

const convertList = async ( dirList, options = {} ) => {
    if( dirList.length === 0 ) return;

    options.outputDir = 'outputDir' in options || path.join( dirList[0], '..', 'output' );
    try{
        await stat( options.outputDir );
    }catch( e ){
        await mkdir( options.outputDir );
    }
    dirList.forEach( ( sourceDir ) => convert( sourceDir, options ) );
}

const convert = async ( sourceDir, options ) => {
    const files     = await readdir( sourceDir );
    const pngFiles  = files.filter( name => /.png$/.test( name ) );
    
    if( pngFiles.length === 0 ) return;

    const binPath   = path.join( BIN_DIR , 'img2webp.exe' );
    const dirName   = path.basename( sourceDir );
    const command = `cd ${sourceDir} && ${binPath} -o ${path.join( options.outputDir, `${dirName}.webp` )} -loop 1 -q 85 -d 83.3 -m 6 -lossy ${pngFiles.join( ' ' )}`;
    
    exec(command, (error, stdout, stderr) => {
        // TODO error handling
        console.log(error);
        console.log(stdout);
        console.log(stderr);
    });
}

module.exports = {
    convertList: convertList
}