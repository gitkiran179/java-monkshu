/* 
 * (C) 2022 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 * 
 * Data decoder / encoder for App
 */

const cache = {};
const rest = require(`${CONSTANTS.LIBDIR}/rest.js`);
const apiConf = require(`${CONSTANTS.APPROOTDIR}/rsjava/conf/dbMagicApiConf.json`);
const fsPromises = require("fs").promises;

async function decodeIncomingData(apiregentry, _url, reqData, _headers, _servObject, reason) {
    try {
        if (apiregentry.query.userprofile) {
            // build api request
            let apiData = {};
            profileConf = await _getProfileConf(apiregentry.query.userprofile);
            if (!profileConf) {
                LOG.error(`[Decode User Profile] Error: Bad Profile Configuration- ${apiregentry.query.userprofile}`);
                // reason.code = 500;
                return false;
            }
            apiData = { ...profileConf.staticLoad };
            let mapErrors = "";
            if (profileConf.map_createRequest) {
                Object.keys(profileConf.map_createRequest).forEach(key => {
                    if (profileConf.map_createRequest[key].isRequired && !reqData[key]) mapErrors = `${(mapErrors) ? mapErrors + "|" : ""} Field: ${key}, Error: Required Field not present`;
                    else apiData[profileConf.map_createRequest[key].key] = reqData[key];
                });
            }
            if (mapErrors) { LOG.error(`[Decode User Profile] Error: ${mapErrors}`); return false; }
            LOG.info(apiData);
            const { error, data, _status, _resHeaders } = await rest[apiConf.method](apiConf.host, apiConf.port, apiConf.path, {}, apiData);
            if (error) { LOG.error(`[Decode User Profile] Error: ${error}`); return false; }
            if (!data || !data.result || !data.data) { LOG.error(`[Decode User Profile] Error: Get user profile API error, received- ${JSON.stringify(data)}`); return false; }
            if (!data.data.length) { LOG.error(`[Decode User Profile] Error: Invalid User, no entry found in DB`); return false; }

            return { userProfile: data.data[0], ...reqData }
        } else return reqData;
    }
    catch (err) {
        LOG.error(`[Decode User Profile] Error: ${err}.`);
        return false;
    }
}

module.exports = { decodeIncomingData }

async function _getProfileConf(name) {
    if (cache[name]) return cache[name];
    try {
        cache[name] = JSON.parse(await fsPromises.readFile(`${APPCONSTANTS.CONF_DIR}/userProfile/userProfile_${name}.json`, "utf8"));
        return cache[name];
    } catch (err) { return null };
}
