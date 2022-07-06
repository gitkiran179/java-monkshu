/** 
 * Configures the user profile to be used by APIs.
 * 
 * (C) 2022 TekMonks. All rights reserved.
 */
const fsPromises = require("fs").promises;
const BB_MSG_TOPIC = "__org_dbmagic_configureUserProfile_bb_msg";

exports.doService = async jsonReq => {
    if (!validateRequest(jsonReq)) {LOG.error("Validation failure."); return CONSTANTS.FALSE_RESULT;}

    if (jsonReq.op == "read") {
        try {return {result: true, data: JSON.parse(await fsPromises.readFile(`${APPCONSTANTS.CONF_DIR}/userProfile/userProfile_${jsonReq.name}.json`, "utf8"))}}
        catch (err) {return CONSTANTS.FALSE_RESULT;}
    } else {    // create, delete or update needs to go to the cluster
        BLACKBOARD.publish(BB_MSG_TOPIC, jsonReq);
        return CONSTANTS.TRUE_RESULT;   // will be configured on each node, and may fail, there should probably be a compensating Blackboard message to rollback on failure
    }
}

exports.addListener = _ => BLACKBOARD.subscribe(BB_MSG_TOPIC, jsonReq => _execDoService(jsonReq));

async function _execDoService(jsonReq) {
    if (jsonReq.op == "delete") {
        try {await fsPromises.unlink(`${APPCONSTANTS.CONF_DIR}/userProfile/userProfile_${jsonReq.name}.json`); return CONSTANTS.TRUE_RESULT;}
        catch (err) {return CONSTANTS.FALSE_RESULT;}
    } else if (jsonReq.op == "create" || jsonReq.op == "update") {    // create or update
        const data = JSON.parse(JSON.stringify(jsonReq)); delete data.op;
        try {
            await fsPromises.writeFile(`${APPCONSTANTS.CONF_DIR}/userProfile/userProfile_${jsonReq.name}.json`, JSON.stringify(data, null, 4), "utf8"); 
            queryAPI.updateQuery(jsonReq.name, data);
            return CONSTANTS.TRUE_RESULT;
        } catch (err) {return CONSTANTS.FALSE_RESULT;}
    }
}

const validateRequest = jsonReq => jsonReq && jsonReq.name && jsonReq.op;