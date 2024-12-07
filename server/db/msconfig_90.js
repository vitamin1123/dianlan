const app = {
    user: 'yzjpt2023',
    password: 'ayHRSEbj4P',
    server: '10.0.0.90',
    database: 'yzjpt2023',
    port: 1433,
    options: {
        encrypt: false, // Use this if you're on Windows Azure
        enableArithAbort: true,
    },
    pool: {
        min: 0,
        max: 10,
        idleTimeoutMillis: 3000
    }
};

module.exports = app;
// var app = {
//     host: "10.0.0.90",
//     user: "yzjpt2023",
//     password: "ayHRSEbj4P",
//     port: "3306",
//     database: "yzjpt2023",
//     waitForConnections: true,  
//     connectionLimit: 10,  
//     queueLimit: 0  
//   };

  
//   module.exports = app
