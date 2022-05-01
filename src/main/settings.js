'use strict';
const { app } = require( 'electron' );
const fs = require('fs');
const path = require( 'path' );

const settingPath = path.join( app.getPath( 'userData' ), 'setting.json' );
let settings;

function load(){
    if( fs.existsSync( settingPath ) ){
        try{
            settings = JSON.parse( fs.readFileSync( settingPath ) );
        }catch(e){
            settings = {};
        }
    }else{
        settings = {};
        fs.writeFileSync( settingPath, JSON.stringify( settings ) );
    }
}
load();

exports.get = function( ...keys ){
    if( keys.length === 0 ) return null;

    if( keys.length === 1 ){
        return keys[0] in settings ? settings[keys[0]] : null;
    }

    const result = {};
    keys.forEach( ( key ) => {
        result[key] = exports.get( key );
    });
    return result;
}

exports.set = function( key, value ){
    if( typeof key === 'object' ){
        const newSettings = key;
        for( let _key in newSettings ){
            settings[_key] = newSettings[_key];
        }
    }else{
        settings[key] = value;
    }
    fs.writeFileSync( settingPath, JSON.stringify( settings ) );
}