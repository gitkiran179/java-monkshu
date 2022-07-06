/* 
 * (C) 2015 TekMonks. All rights reserved.
 * See enclosed LICENSE file.
 */

const path = require("path");

APP_ROOT = `${path.resolve(`${__dirname}/../../`)}`;

exports.APP_ROOT = APP_ROOT;
exports.CONF_DIR = `${APP_ROOT}/conf`;
exports.API_DIR = `${APP_ROOT}/apis`;
exports.LIB_DIR = __dirname;

exports.USERS_KEY = "__org_dbmagic_user_registry";