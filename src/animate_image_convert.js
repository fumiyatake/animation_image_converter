'use strict';

const path = require( 'path' );
const util = require( 'util' );
const childProcess = require('child_process');
const exec = util.promisify(childProcess.exec);

const { readdir, mkdir, rm ,stat } = require('fs').promises;
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
};

const convert = async ( sourceDir, options ) => {
    const files     = await readdir( sourceDir );
    const targetFiles  = files.filter( name => /.png$/.test( name ) );
    const result = {
        path    : sourceDir,
        success : false,
        message : ''
    };

    if( targetFiles.length === 0 ){
        result.message = 'cannot find valid format image in this directory.';
        return result;
    }

    const compressedDir = path.join( sourceDir, 'compress' );
    await compress( sourceDir, compressedDir, targetFiles );

    const promiseList = [];
    promiseList.push( createWebp( sourceDir, targetFiles, path.basename( sourceDir ), options ) );
    promiseList.push( createApng( compressedDir, targetFiles, path.basename( sourceDir ), options ) );
    await Promise.all( promiseList )
        .then(( values ) => {
            result.success = true;
        })
        .catch(( e ) => {
            result.message = e.message;
        })
        .finally( async() =>{
            // 圧縮した画像を削除
            // TODO: オプションで一応残せるようにしたい
            await rm( compressedDir, { recursive: true, force: true } );
        });
    return result;
};

const compress = async( sourceDir, compressedDir, targetFiles ) => {
    // imageminはPure ESModule形式で他がCommonJS形式なのでDynamic importによる読み込みを使用
    const { default: imagemin }         = await import( 'imagemin' );
    const { default: imageminPngquant } = await import( 'imagemin-pngquant' );
    
    try{
        await stat( compressedDir );
    }catch( e ){
        await mkdir( compressedDir );
    }
    
    await imagemin( targetFiles.map( file => path.join( sourceDir, file ) ), {
        destination: compressedDir,
        plugins:[
            imageminPngquant({
                speed: 1,
                quality: [0.7, 0.7],
            })
        ]
    });
}

const createWebp = async ( sourceDir, targetFiles, outputFileName, options ) => {
    const binPath   = path.join( BIN_DIR , 'img2webp.exe' );
    const command = `cd ${sourceDir} && ${binPath} -o ${path.join( options.outputDir, `${outputFileName}.webp` )} -loop 1 -q 85 -d 83.3 -m 6 -lossy ${targetFiles.join( ' ' )}`;
    const result = await exec(command);
    return result;
};

const createApng = async( sourceDir, targetFiles, outputFileName, options ) => {
    const binPath   = path.join( BIN_DIR , 'apngasm64.exe' );
    const command = `cd ${sourceDir} && ${binPath} ${path.join( options.outputDir, `${outputFileName}.png` )} ${targetFiles.join( ' ' ) } 1 12 -l1 -z2`;
    const result = await exec(command);
    return result;
}

module.exports = {
    convertList: convertList
}