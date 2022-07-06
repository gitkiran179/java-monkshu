/** 
 * DB abstraction layer.
 * 
 * (C) 2020 TekMonks. All rights reserved.
 */
const fsPromises = require("fs").promises;
const conf = require(`${APP_CONSTANTS.CONF_DIR}/drivers.json`);
const cryptMod = require(CONSTANTS.LIBDIR + "/crypt.js");
const ORACLE_DB_DRIVER = "oracledb";
const selected_driver = "oracledb";
let pools = {}, error;

async function runStatement(dbID, statement, params) {
    const conn = await _getConnection(dbID); if (!conn) return false;
    LOG.info(params);
    try { await conn.execute(statement, params); return true; } catch (err) { error = `DB error running ${statement}, error is: ${err}`; LOG.error(error); return false; }
}

async function runQuery(dbID, query, params) {
    const conn = await _getConnection(dbID); if (!conn) return false;
    try {
        const dbResult = await conn.query(query, params);
        if (dbResult.rows) return dbResult.rows;     // PostgreSQL
        if (dbResult.meta) { delete dbResult.meta; return dbResult; }     // MariaDB, MySQL and MemSQL
        if (dbResult) return dbResult;
    } catch (err) { error = `DB error running ${query}, error is: ${err}`; LOG.error(error); return false; }
}

async function refreshConfig(dbID) {
    if (pools[dbID]) { await pools[dbID].end(); pools[dbID] = null }

    pools[dbID] = await _getConnection(dbID);
    if (!pools[dbID]) return false; else return true;
}

async function _getConnection(dbID) {
    if (pools && pools[dbID]) return selected_driver != ORACLE_DB_DRIVER ? pools[dbID] : _getOracleConnectionFromPool(pools[dbID]);

    try {
        const configs = JSON.parse(await fsPromises.readFile(`${APP_CONSTANTS.CONF_DIR}/connection.json`, "utf8"));
        const config = configs[dbID];
        if (!config?.password) config.password = cryptMod.decrypt(config.encrypted_password);
        const connCode = conf.drivers[config.driver];
        const connCreator = (connCode, config) => eval(connCode);
        pools[dbID] = await connCreator(connCode, config);
        if (config.driver != ORACLE_DB_DRIVER) return pools[dbID];;    // other DBs can directly execute via pools
        return _getOracleConnectionFromPool(pools[dbID]);
    } catch (err) {
        LOG.error(`DB error connecting to DB, error is: ${err}`);
        return;
    }
}


/**
 * Create an Oracle DB connection from an existing pool.  Oracle explicitly needs a connection 
 * from the pool and won't close connection unless explicitly closed. So this function exists to
 * make it compatible to other DBs.
 * @param {object} oraclePool The oracle DB pool 
 * @returns The connection which can execute statements and queries.
 */
async function _getOracleConnectionFromPool(oraclePool) {
    const db = require(ORACLE_DB_DRIVER), connection = await db.getConnection(oraclePool.poolAlias);
    const oldexecute = connection.execute;
    connection.execute = async function () { // monkey patch a new execute
        try { return await oldexecute.call(connection, arguments[0], arguments[1], { autoCommit: true }); }
        catch (err) { throw (err); } finally { connection.close(); }
    };
    connection.query = async function () { // monkey patch a new query
        try { return await oldexecute.call(connection, arguments[0], arguments[1], { outFormat: db.OUT_FORMAT_OBJECT }); }
        catch (err) { throw (err); } finally { connection.close(); }
    };
    return connection;
}

module.exports = { runStatement, runQuery, refreshConfig, getError: _ => error }