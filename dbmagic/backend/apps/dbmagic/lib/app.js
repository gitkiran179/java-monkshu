/* 
 * (C) 2020 TekMonks. All rights reserved.
 */

module.exports.initSync = function() {
    global.APP_CONSTANTS = require(`${__dirname}/../apis/lib/constants.js`);
    
    // add listeners for distributed clustering to work with configurations in sync
    require(`${APP_CONSTANTS.API_DIR}/configuredb.js`).addListener();
    require(`${APP_CONSTANTS.API_DIR}/configurequery.js`).addListener();
    require(`${APP_CONSTANTS.API_DIR}/configureuser.js`).addListener();
}