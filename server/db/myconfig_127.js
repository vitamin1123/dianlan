var app = {
    host: "127.0.0.1",
    user: "",
    password: "",
    port: "3306",
    database: "",
    waitForConnections: true,  
    connectionLimit: 10,  
    queueLimit: 0,
    maxIdle: 10,
    idleTimeout: 60000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  };

  
  module.exports = app
