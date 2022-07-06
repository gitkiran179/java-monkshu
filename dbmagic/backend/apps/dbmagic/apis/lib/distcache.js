/** 
 * Distributed cache for DB Magic.
 * 
 * (C) 2020 TekMonks. All rights reserved.
 */

function get(key) {
    return DISTRIBUTED_MEMORY.get(key);
}

async function set(key, value) {
    await DISTRIBUTED_MEMORY.set(key, value);
}

function remove(key) {
    DISTRIBUTED_MEMORY.set(key, null);
}

function listen(key, cb) {
    DISTRIBUTED_MEMORY.listen(key, cb);
} 

module.exports = {get, set, remove, listen};