const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: "127.0.0.1",
  user: "",
  password: "",
  port: "3306",
  database: "",
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

    const results = [];
    for (let i = 0; i < sqls.length; i++) {
      const [rows] = await connection.query(sqls[i], params[i]);
      results.push(rows);
    }

    await connection.commit();
    console.log("事务提交成功");
    return results;
  } catch (error) {
    try {
      await connection.rollback();
      console.log("事务回滚成功");
    } catch (rollbackErr) {
      console.error("事务回滚失败：" + rollbackErr);
    } finally {
      connection.release();
    }

    // 抛出错误，调用方处理
    throw error;
  }
}

module.exports = {
  transaction,
};
