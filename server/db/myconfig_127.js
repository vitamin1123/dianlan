var app = {
    host: "127.0.0.1",
    user: "root",
    password: "123456",
    port: "3306",
    database: "dev",
    waitForConnections: true,  
    connectionLimit: 10,  
    queueLimit: 0,
    maxIdle: 10,
    idleTimeout: 60000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  };

  
  module.exports = app
