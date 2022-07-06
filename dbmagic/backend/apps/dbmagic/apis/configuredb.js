/** 
 * Configures the database for DB magic.
 * 
 * (C) 2020 TekMonks. All rights reserved.
 */

const fsPromises = require("fs").promises;
const dbUtils = require(`${APP_CONSTANTS.LIB_DIR}/db.js`);
const BB_MSG_TOPIC = "__org_dbmagic_configuredatabase_bb_msg";

exports.doService = async jsonReq => {
	if (!validateRequest(jsonReq)) {LOG.error("Validation failure."); return CONSTANTS.FALSE_RESULT;}
    BLACKBOARD.publish(BB_MSG_TOPIC, jsonReq);
    return CONSTANTS.TRUE_RESULT;   // will be configured on each node, and may fail, there should probably be a compensating Blackboard message to rollback on failure   
}

exports.addListener = _ => BLACKBOARD.subscribe(BB_MSG_TOPIC, jsonReq => _execDoService(jsonReq));

async function _execDoService(jsonReq) {
    try {
        const dbID = jsonReq.dbID;
        delete jsonReq.dbID;
        const connectionConf = JSON.parse(await fsPromises.readFile(`${APP_CONSTANTS.CONF_DIR}/connection.json`, "utf8"));
        connectionConf[dbID] = jsonReq;
        await fsPromises.writeFile(`${APP_CONSTANTS.CONF_DIR}/connection.json`, JSON.stringify(connectionConf, null, 4), "utf8");
        return {result: await dbUtils.refreshConfig(dbID)};
    } catch (err) {return CONSTANTS.FALSE_RESULT;}
}

const validateRequest = jsonReq => jsonReq && jsonReq.dbID && jsonReq.driver && jsonReq.host && jsonReq.user && jsonReq.password;