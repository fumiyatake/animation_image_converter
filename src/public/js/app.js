(function(){
    'use strict';

    const btn = document.getElementById( 'button' );
    const text = document.getElementById( 'text' );
    btn.addEventListener( 'click', async () => {
            const dirList = await window.myApi.selectDirectory();
            text.innerHTML = dirList.join( '<br>' );
            window.myApi.convertAnimateImage( dirList );
    } );
})();