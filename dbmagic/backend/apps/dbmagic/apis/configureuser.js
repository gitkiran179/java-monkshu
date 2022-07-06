/** 
 * Add / modify users to the file based registry. 
 * 
 * Add - pass in new ID and password
 * Modify - pass in existing ID and new password
 * Delete - pass in existing ID and empty password
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

        if (jsonReq.secret == "") delete registry[jsonReq.user.trim()]; else registry[jsonReq.user.trim()] = crypt.encrypt(jsonReq.secret); 
        cache.set(APP_CONSTANTS.USERS_KEY, registry); 
        
        return CONSTANTS.TRUE_RESULT;
    } catch (err) {
        LOG.error(`Registration for user ${jsonReq.user} failed due to error: ${err}`);
        return {result: false, error: err};
    }
}

exports.addListener = _ => cache.listen(APP_CONSTANTS.USERS_KEY, (_,registry) => this.writeRegistry(registry));

exports.writeRegistry = async registry => await fsPromises.writeFile(`${APP_CONSTANTS.CONF_DIR}/users.json`, JSON.stringify(registry, null, 4), "utf8");

const validateRequest = jsonReq => jsonReq && jsonReq.user && jsonReq.secret;