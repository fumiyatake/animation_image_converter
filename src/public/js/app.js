(function(){
    'use strict';

    const buttonSelectFolder    = document.getElementById( 'buttonSelectFolder' );
    const buttonExecute         = document.getElementById( 'buttonExecute' );
    const checkboxLoop          = document.getElementById( 'checkboxLoop' );

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

        const result = await window.myApi.convertAnimateImage( dirList, getOptions() );
        progressText.innerHTML = '';
        successText.innerHTML = result.success.join( '<br>' );
        errorText.innerHTML = result.error.map( err => {
            return `${err.path}<br><pre>${err.message}</pre>`
        } ).join( '<br>' );
        
        buttonSelectFolder.removeAttribute( 'disabled' );

    });

    const getOptions = () => {
        return {
            'loop' : checkboxLoop.checked ? '0' : '1'   // ループ回数は0=無限
        }
    }
})();