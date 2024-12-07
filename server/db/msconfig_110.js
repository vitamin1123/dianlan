// let app = {
//     user: 'test',
//     password: '123456',
//     server: '10.0.2.110',
//     database: 'dev',
//     port: 1433,
//     options: {
//         encrypt: false, // Use this if you're on Windows Azure
//         enableArithAbort: true,
//     },
//     pool: {
//         min: 0,
//         max: 10,
//         idleTimeoutMillis: 3000
//     }
// };

// module.exports = app;
var app = {
    host: "10.0.2.110",
    user: "test",
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
