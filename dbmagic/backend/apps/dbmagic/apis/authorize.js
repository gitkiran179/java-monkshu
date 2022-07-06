/** 
 * JWT authorizer - file based registry
 * 
 * (C) 2020 TekMonks. All rights reserved.
 */
const fsPromises = require("fs").promises;
const crypt = require(`${CONSTANTS.LIBDIR}/crypt.js`);
const cache = require(`${APP_CONSTANTS.LIB_DIR}/distcache.js`);

exports.doService = async jsonReq => {
    if (!validateRequest(jsonReq)) {LOG.error("Validation failure."); return CONSTANTS.FALSE_RESULT;}

    try {
        let registry = cache.get(APP_CONSTANTS.USERS_KEY); if (!registry) {
            registry = JSON.parse(await fsPromises.readFile(`${APP_CONSTANTS.CONF_DIR}/users.json`, "utf8"));
            cache.set(APP_CONSTANTS.USERS_KEY, registry);
        }
        
        if (registry[jsonReq.user] && jsonReq.secret == crypt.decrypt(registry[jsonReq.user])) return CONSTANTS.TRUE_RESULT; else return CONSTANTS.FALSE_RESULT;
    } catch (err) {
        LOG.error(`Authentication for user ${jsonReq.user} failed due to error: ${err}`);
        return CONSTANTS.FALSE_RESULT;
    }
}

const validateRequest = jsonReq => jsonReq && jsonReq.user && jsonReq.secret;