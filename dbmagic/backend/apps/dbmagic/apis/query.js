/** 
 * Runs CRUD operations on a given table and DB.
 * 
 * (C) 2020 TekMonks. All rights reserved.
 */

const cache = {};
const Mustache = require("mustache");
const fsPromises = require("fs").promises;
const dbUtils = require(`${APP_CONSTANTS.LIB_DIR}/db.js`);
const distributed_cache = require(`${APP_CONSTANTS.LIB_DIR}/distcache.js`);

exports.doService = async jsonReq => {
    if (!validateRequest(jsonReq)) { LOG.error("Validation failure."); return CONSTANTS.FALSE_RESULT; }
    LOG.info(`[DbMagic-Query] Received: ${JSON.stringify(jsonReq)}`);
    const conf = await _getQueryConf(jsonReq.query); if (!conf) return { result: false, error: "Bad query configuration." }
    const params = []; for (const [key, value] of Object.entries(conf.parameter_map)) params[parseInt(key)] = jsonReq[value];
    let retData;
    if (conf.type == "statement") {
        if (await dbUtils.runStatement(jsonReq.dbID, conf.query, params)) { _invalidateCacheIDs(conf, jsonReq); return CONSTANTS.TRUE_RESULT; }
        else return { result: false, error: dbUtils.getError() }
    } else if (conf.type == "query") {
        let cacheID;
        if (conf.cache_id) {
            cacheID = Mustache.render(conf.cache_id, jsonReq);
            retData = distributed_cache.get(cacheID);
        }

        if (!retData) { retData = await dbUtils.runQuery(jsonReq.dbID, conf.query, params); if (conf.cache_id && retData) distributed_cache.set(cacheID, retData); }
        else LOG.info(`Cache hit for ID: ${cacheID}`);

        if (retData) {
            LOG.info(JSON.stringify(retData));
            return { result: true, data: retData }
        } else {
            return { result: false, error: dbUtils.getError() }
        }
    } else return { result: false, error: "Bad operation in query definition." };
}

exports.updateQuery = (name, query) => cache[name] = query;

async function _getQueryConf(name) {
    if (cache[name]) return cache[name];

    try {
        cache[name] = JSON.parse(await fsPromises.readFile(`${APP_CONSTANTS.CONF_DIR}/query_${name}.json`, "utf8"));
        return cache[name];
    } catch (err) { return null };
}

function _invalidateCacheIDs(conf, data) {
    if (!conf.invalidate_cache_ids) return;
    for (const cacheID of conf.invalidate_cache_ids) distributed_cache.remove(Mustache.render(cacheID, data));
}

const validateRequest = jsonReq => jsonReq && jsonReq.query;