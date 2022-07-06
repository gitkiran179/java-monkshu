/* 
 * (C) 2022 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 * 
 * App file for RakutenSecurities
 */

exports.initSync = _ => {
    global.APPCONSTANTS = require(`${__dirname}/constants.js`)

    // add listeners for distributed clustering to work with configurations in sync
    require(`${APPCONSTANTS.API_DIR}/lib/userProfile/configureUserProfile.js`).addListener();
}