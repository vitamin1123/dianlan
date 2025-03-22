var app = {
    host: "172.27.0.17",
    user: "root",
    password: "lx217102xx",
    port: "3306",
    database: "yzjlx_erp",
    waitForConnections: true,  
    connectionLimit: 10,  
    queueLimit: 0,
    maxIdle: 10,
    idleTimeout: 60000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  };

  
  module.exports = app
