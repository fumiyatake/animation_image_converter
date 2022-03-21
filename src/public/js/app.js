(function(){
    'use strict';

    const btn           = document.getElementById( 'button' );
    const progressText  = document.getElementById( 'progressText' );
    const successText   = document.getElementById( 'successText' );
    const errorText     = document.getElementById( 'errorText' );

    btn.addEventListener( 'click', async () => {
        const dirList = await window.myApi.selectDirectory();
        progressText.innerHTML = dirList.join( '<br>' );

        const result = await window.myApi.convertAnimateImage( dirList );
        progressText.innerHTML = '';
        successText.innerHTML = result.success.join( '<br>' );
        errorText.innerHTML = result.error.map( err => {
            return `${err.path}<br><pre>${err.message}</pre>`
        } ).join( '<br>' );
    });
})();