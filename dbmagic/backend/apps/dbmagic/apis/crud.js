/** 
 * Runs CRUD operations on a given table and DB.
 * 
 * (C) 2020 TekMonks. All rights reserved.
 */

 const dbUtils = require(`${APP_CONSTANTS.LIB_DIR}/db.js`);
 const distributed_cache = require(`${APP_CONSTANTS.LIB_DIR}/distcache.js`);
 
 exports.doService = async jsonReq => {
     if (!validateRequest(jsonReq)) { LOG.error("Validation failure."); return CONSTANTS.FALSE_RESULT; }
 
     let query = "select 1"; const table = `${jsonReq.db}.${jsonReq.table}`, cacheID = `${jsonReq.dbID}+${table}+${jsonReq.data[jsonReq.id_key]}`;
     if (jsonReq.op == "create") query = `insert into ${table} (${Object.keys(jsonReq.data).join(",")}) values ${_getValues(jsonReq.data)}`;
     if (jsonReq.op == "update") query = `update ${table} set ${_getUpdateSetter(jsonReq.data, jsonReq.id_key)} where ${jsonReq.id_key}=${_parseValueAsSQLIntOrString(jsonReq.data[jsonReq.id_key])}`;
     if (jsonReq.op == "delete") query = `delete from ${table} where ${jsonReq.id_key}=${_parseValueAsSQLIntOrString(jsonReq.data[jsonReq.id_key])}`;
     if (jsonReq.op == "read") query = `select * from ${table} where ${jsonReq.id_key}=${_parseValueAsSQLIntOrString(jsonReq.data[jsonReq.id_key])}`;
 
     if ((jsonReq.op == "create" || jsonReq.op == "update" || jsonReq.op == "delete")) {
         if (await dbUtils.runStatement(jsonReq.dbID, query)) { distributed_cache.remove(cacheID); return CONSTANTS.TRUE_RESULT; }
         else return { result: false, error: dbUtils.getError() }
     } else if (jsonReq.op == "read") {
         let data = distributed_cache.get(cacheID);
         if (!data) { data = await dbUtils.runQuery(jsonReq.dbID, query); if (data) distributed_cache.set(cacheID, data); }
         else LOG.info(`Cache hit for ID: ${cacheID}`);
 
         if (data) return { result: true, data }; else return { result: false, error: dbUtils.getError() }
     } else return { result: false, error: "Bad operation." };
 }
 
 function _parseValueAsSQLIntOrString(value) {
     const parsed = parseInt(value);
     return isNaN(parsed) ? `'${value}'` : parsed;
 }
 
 function _getValues(data) {
     let values = [];
     for (const key of Object.keys(data)) values.push(data[key]);
     return `(${values.join(",")})`;
 }
 
 function _getUpdateSetter(data, id_key) {
     let values = [];
     for (const key of Object.keys(data)) if (key == id_key) continue; else values.push(`${key}=${data[key]}`);
     return values.join(",");
 }
 
 const validateRequest = jsonReq => jsonReq && jsonReq.dbID && jsonReq.op && jsonReq.db && jsonReq.table && jsonReq.data && jsonReq.id_key;