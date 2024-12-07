//db.js
const mysql = require('mysql2/promise');  


  
// 数据库配置  
 
  
// 创建连接池  
let pool;  
  
async function createPool(cfg) {  
    if (!pool) {  
        pool = mysql.createPool(cfg);  
    }  
    return pool;  
}  
  
// 查询  
async function query(sql, params = [],cfg) {  
    const pool = await createPool(cfg);  
    try {  
        const [rows, fields] = await pool.execute(sql, params);  
        return rows;  
    } catch (error) {  
        console.error('Query error:', error);  
        throw error;  
    }  
}  
  
// 插入  
async function insert(table, data) {  
    const keys = Object.keys(data).join(', ');  
    const values = Object.values(data).map(value => `'${mysql.escape(value)}'`).join(', ');  
    const sql = `INSERT INTO ${table} (${keys}) VALUES (${values})`;  
    return await query(sql);  
}  
  
// 更新  
async function update(table, data, where) {  
    const sets = Object.keys(data).map(key => `${key} = '${mysql.escape(data[key])}'`).join(', ');  
    const sql = `UPDATE ${table} SET ${sets} WHERE ${where}`;  
    return await query(sql);  
}  
  
// 删除  
async function deleteRow(table, where) {  
    const sql = `DELETE FROM ${table} WHERE ${where}`;  
    return await query(sql);  
}  
  
// 导出函数  
module.exports = {  
    query,  
    insert,  
    update,  
    deleteRow  
};


