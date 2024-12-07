let app = {
    user: 'sa',
    password: 'qwe@123',
    server: '10.0.0.14',
    database: 'YZJ_DATA',
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