const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: "127.0.0.1",
  user: "test",
  password: "123456",
  port: "3306",
  database: "dev",
  waitForConnections: true,  
  connectionLimit: 10, 
  maxIdle: 10, 
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

/**
 * mysql 事务处理
 * @param {Array} sqls 需要执行的sql语句
 * @param {Array} params 对应上面sql语句的参数
 * @returns {Promise} 返回一个Promise
 */
async function transaction(sqls, params) {
  if (sqls.length !== params.length) {
    throw new Error("语句与传值不匹配");
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    console.log("开始执行事务，共执行" + sqls.length + "条语句");

    // 执行所有的 SQL 语句
    const results = await Promise.all(
      sqls.map((sql, index) => connection.query(sql, params[index]))
    );

    // 提交事务
    await connection.commit();
    connection.release();

    // 返回每个 SQL 语句的执行结果
    return results.map(([rows]) => rows);
  } catch (error) {
    // 回滚事务
    try {
      await connection.rollback();
      console.log("事务回滚成功");
    } catch (rollbackErr) {
      console.log("事务回滚失败：" + rollbackErr);
    } finally {
      connection.release();
    }
    return error;
  }
}

module.exports = {
  transaction,
};
