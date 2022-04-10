(function(){
    'use strict';

    // button
    const buttonSelectFolder    = document.getElementById( 'buttonSelectFolder' );
    const buttonExecute         = document.getElementById( 'buttonExecute' );

    // common setting
    const checkboxTargetWebp    = document.getElementById( 'checkboxTargetWebp' );
    const checkboxTargetApng    = document.getElementById( 'checkboxTargetApng' );
    const checkboxLoop          = document.getElementById( 'checkboxLoop' );
    const numberFramerate       = document.getElementById( 'numberFramerate' );
    const checkboxSaveCompress  = document.getElementById( 'checkboxSaveCompress' );

    // webp
    const webpSettingBlock          = document.getElementById( 'webpSettings' );
    const checkboxWebpCompress      = document.getElementById( 'checkboxWebpCompress' );
    const selectWebpCompressPreset  = document.getElementById( 'selectWebpCompressPreset' );
    const checkboxWebpQualityAuto   = document.getElementById( 'checkboxWebpQualityAuto' );
    const numberWebpQuality         = document.getElementById( 'numberWebpQuality' );

    // apng
    const apngSettingBlock          = document.getElementById( 'apngSettings' );
    const checkboxPngCompress       = document.getElementById( 'checkboxPngCompress' );
    const numberPngQuality          = document.getElementById( 'numberPngQuality' );
    const selectApngCompressType    = document.getElementById( 'selectApngCompressType' );

    // log
    const selectedText          = document.getElementById( 'selectedText' );
    const progressText          = document.getElementById( 'progressText' );
    const successText           = document.getElementById( 'successText' );
    const errorText             = document.getElementById( 'errorText' );

    let dirList = [];

    buttonSelectFolder.addEventListener( 'click', async () => {
        dirList = await window.myApi.selectDirectory();
        selectedText.innerHTML = dirList.join( '<br>' );

        if( dirList.length === 0 ){
            buttonExecute.setAttribute( 'disabled', 'true' );
        }else{
            buttonExecute.removeAttribute( 'disabled' );
        }
    });

    buttonExecute.addEventListener( 'click', async () => {
        if( dirList.length === 0 ) return;

        buttonExecute.setAttribute( 'disabled', 'true' );
        buttonSelectFolder.setAttribute( 'disabled', 'true' );
        selectedText.innerHTML = '';
        progressText.innerHTML = dirList.join( '<br>' );

        const promiseList = [];
        const options = getOptions( dirList );

        dirList.forEach( async ( sourceDir ) => {
            promiseList.push( window.myApi.convertAnimateImage( sourceDir, options ) );
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

        progressText.innerHTML = '';
        successText.innerHTML = successList.join( '<br>' );
        errorText.innerHTML = errorList.map( err => {
            return `${err.path}<br><pre>${err.message}</pre>`
        } ).join( '<br>' );
        
        buttonSelectFolder.removeAttribute( 'disabled' );
        window.myApi.showResult( options.outputDir, successList.length, errorList.length );
    });

    checkboxTargetWebp.addEventListener( 'change', function(){
        webpSettingBlock.style.display = this.checked ? 'block' : 'none';
    });

    checkboxTargetApng.addEventListener( 'change', function(){
        apngSettingBlock.style.display = this.checked ? 'block' : 'none';
    });

    checkboxWebpQualityAuto.addEventListener( 'change', function(){
        if( this.checked ){
            numberWebpQuality.setAttribute( 'disabled', 'true' );
        }else{
            numberWebpQuality.removeAttribute( 'disabled' );
        }
    });

    const getOptions = ( dirList ) => {
        const options = {
            'outputDir'         : [ ...dirList[0].split( window.vars.ds ).slice( 0, -1 ), 'output' ].join( window.vars.ds ),
            'framerate'         : numberFramerate.value,
            'loop'              : checkboxLoop.checked ? '0' : '1', // ループ回数は0=無限
            'save_compressed'   : checkboxSaveCompress.checked
        }

        if( checkboxTargetWebp.checked ){
            options['webp'] = {
                'compress'          : checkboxWebpCompress.checked,
                'compress_preset'   : selectWebpCompressPreset.value,
                'minsize'           : checkboxWebpQualityAuto.checked,
                'quality'           : numberWebpQuality.value,
            };
        }
        if( checkboxTargetApng.checked ){
            options['apng'] = {
                'compress'              : checkboxPngCompress.checked,
                'quality_min'           : numberPngQuality.value,   // pngquantの画質設定（現状最小と最大は1つに
                'quality_max'           : numberPngQuality.value,
                'apng_compress_type'    : selectApngCompressType.value,
            };
        }
        return options;
    }
})();