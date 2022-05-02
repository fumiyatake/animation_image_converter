'use strict';

const path = require( 'path' );
const util = require( 'util' );
const childProcess = require('child_process');
const exec = util.promisify(childProcess.exec);

const { readdirSync, mkdirSync, rmSync ,existsSync } = require('fs');
const { BIN_DIR } = require( './config.js' );

const convert = async ( sourceDir, options ) => {
    const files     = readdirSync( sourceDir );
    const targetFiles  = files.filter( name => /\.png$/.test( name ) );
    const result = {
        path    : sourceDir,
        success : false,
        message : ''
    };
    let isCompressedWebp = false;
    let isCompressedPng = false;
    let compressedDirWebp;
    let compressedDirPng;

    if( targetFiles.length === 0 ){
        result.message = 'cannot find valid format image in this directory.';
        return result;
    }

    if( !existsSync( options.outputDir ) ){
        mkdirSync( options.outputDir, { recursive: true } );
    }

    const promiseList = [];
    if( 'webp' in options ){
        let sourceDirForWebp = '';
        let targetFileForWebp = '';
        if( options.webp.compress ){
            isCompressedWebp = true;
            compressedDirWebp= path.join( sourceDir, 'compress_webp' );
            await compressWebp( sourceDir, compressedDirWebp, targetFiles, options );

            sourceDirForWebp    = compressedDirWebp;
            targetFileForWebp   = targetFiles.map( name => name.replace( /\.png$/, '.webp' ) );
        }else{
            sourceDirForWebp    = sourceDir;
            targetFileForWebp   = targetFiles;
        }
        promiseList.push( createWebp( sourceDirForWebp, targetFileForWebp, path.basename( sourceDir ), options ) );
    }

    if( 'apng' in options ){
        let sourceDirForApng = '';
        if( options.apng.compress ){
            isCompressedPng = true;
            compressedDirPng= path.join( sourceDir, 'compress_apng' );
            await compressPng( sourceDir, compressedDirPng, targetFiles, options );

            sourceDirForApng = compressedDirPng;
        }else{
            sourceDirForApng = sourceDir;
        }
        promiseList.push( createApng( sourceDirForApng, targetFiles, path.basename( sourceDir ), options ) );
    }

    await Promise.all( promiseList )
        .then(( values ) => {
            result.success = true;
        })
        .catch(( e ) => {
            result.message = e.message;
        })
        .finally( async() =>{
            // 圧縮した画像を削除
            if( !options.save_compressed ){
                if( isCompressedWebp )  rmSync( compressedDirWebp, { recursive: true, force: true } );
                if( isCompressedPng )   rmSync( compressedDirPng, { recursive: true, force: true } );
            }
        });
    return result;
};

const compressWebp = async( sourceDir, compressedDir, targetFiles, options ) => {
    // imageminはPure ESModule形式で他がCommonJS形式なのでDynamic importによる読み込みを使用
    const { default: imagemin }     = await import( 'imagemin' );
    const { default: imageminWebp } = await import( 'imagemin-webp' );
    
    if( !existsSync( compressedDir ) ){
        mkdirSync( compressedDir, { recursive: true } );
    }
    
    await imagemin( targetFiles.map( file => path.join( sourceDir, file ) ), {
        destination: compressedDir,
        glob: false,
        plugins:[
            imageminWebp({
                preset: options.webp.compress_preset,
                method : 6,
            })
        ]
    });
}

const compressPng = async( sourceDir, compressedDir, targetFiles, options ) => {
    // imageminはPure ESModule形式で他がCommonJS形式なのでDynamic importによる読み込みを使用
    const { default: imagemin }         = await import( 'imagemin' );
    const { default: imageminPngquant } = await import( 'imagemin-pngquant' );
    
    if( !existsSync( compressedDir ) ){
        mkdirSync( compressedDir, { recursive: true } );
    }
    
    await imagemin( targetFiles.map( file => path.join( sourceDir, file ) ), {
        destination: compressedDir,
        glob: false,
        plugins:[
            imageminPngquant({
                speed: 1,
                quality: [
                    options.apng.quality_min / 100, 
                    options.apng.quality_max / 100
                ],
            })
        ]
    });
}

const createWebp = async ( sourceDir, targetFiles, outputFileName, options ) => {
    const binPath   = path.join( BIN_DIR , 'img2webp', 'img2webp.exe' );
    const drive = sourceDir.slice(0,2);
    const optionString = [
        `-o "${path.join( options.outputDir, `${outputFileName}.webp` )}"`,
        `-loop ${options.loop}`,
        `-d ${ 1000 / options.framerate}`,
        options.webp.minsize ?  `-min_size` : `-q ${options.webp.quality}`,
        `-m 6`,
        `-lossy`,
        targetFiles.map( file => `"${file}"` ).join( ' ' ),
    ].join( ' ' );
    // コマンドには文字数制限があるため、超えないようにcdで素材フォルダまで移動したうえで実行
    // ※別ドライブに移動する場合、cdの前にドライブ自体の移動が必要
    const command = `${drive} && cd "${sourceDir}" && "${binPath}" ${optionString}`;
    console.log(command);
    const result = await exec(command);
    return result;
};

const createApng = async( sourceDir, targetFiles, outputFileName, options ) => {
    const binPath   = path.join( BIN_DIR , 'apngasm', 'apngasm64.exe' );
    const drive = sourceDir.slice(0,2);
    const optionString = [
        `"${path.join( options.outputDir, `${outputFileName}.png` )}"`,  // output
        targetFiles.map( file => `"${file}"` ).join( ' ' ), // source files
        `1 ${options.framerate}`,
        `-l${options.loop}`,
        `-z${options.apng.apng_compress_type}`,
    ].join( ' ' );
    // コマンドには文字数制限があるため、超えないようにcdで素材フォルダまで移動したうえで実行
    // ※別ドライブに移動する場合、cdの前にドライブ自体の移動が必要
    const command = `${drive} && cd "${sourceDir}" && "${binPath}" ${optionString}`;
    console.log(command);
    const result = await exec(command);
    return result;
}

module.exports = {
    convert: convert
}