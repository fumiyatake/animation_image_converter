'use strict';

const path = require( 'path' );
const util = require( 'util' );
const childProcess = require('child_process');
const exec = util.promisify(childProcess.exec);

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

    const promiseList = [];
    dirList.forEach( async ( sourceDir ) => {
        promiseList.push( convert( sourceDir, options ) );
    });

    const successList = [], errorList = [];
    await Promise.all( promiseList ).then( values => { 
        values.forEach( result => {
            if( result.success ){
                successList.push( result.path );
            }else{
                errorList.push( result );
            }
        });

    });
    return { success: successList, error: errorList };
}

const convert = async ( sourceDir, options ) => {
    const files     = await readdir( sourceDir );
    const pngFiles  = files.filter( name => /.png$/.test( name ) );
    const result = {
        path    : sourceDir,
        success : false,
        message : ''
    };

    if( pngFiles.length === 0 ){
        result.message = 'cannot find valid format image in this directory.';
        return result;
    }

    const binPath   = path.join( BIN_DIR , 'img2webp.exe' );
    const dirName   = path.basename( sourceDir );
    const command = `cd ${sourceDir} && ${binPath} -o ${path.join( options.outputDir, `${dirName}.webp` )} -loop 1 -q 85 -d 83.3 -m 6 -lossy ${pngFiles.join( ' ' )}`;
    
    try{
        const res = await exec(command);
    }catch( e ){
        result.message = e.message;
        return result;
    }
    result.success = true;
    return result;
}

module.exports = {
    convertList: convertList
}