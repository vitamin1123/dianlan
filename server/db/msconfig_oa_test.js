let app = {
    user: 'sa',
    password: 'Hello1234',
    server: '192.168.0.172',
    database: 'A8',
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