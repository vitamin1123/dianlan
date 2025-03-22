//db.js
const mssql = require('mssql');


/////////////////////////
// let pool = new sql.ConnectionPool(dbconfig);
// let poolConnect = pool.connect();
// async function QUser(){
//     await poolConnect;
//     let res = await new sql.Request(pool)
//                 .input("FCell",sql.NVarChar,'15558115805')
                
//                 //.query(`insert into user_info (username,password) values (@name,@pwd)`);
//                 .query(`select * from T_BD_Person where FCell = @FCell;`);
//     console.log(res)
//     return res;
    
// }
// module.exports.QUser = QUser
////////////////////////


let connectionPool;
var getConnection = async function(cfg){//连接数据库

    if(!(connectionPool && connectionPool.connected)) {

        connectionPool = await mssql.connect(cfg);

    }

    return connectionPool;

}
var querySql = async function (sql, params, cfg) {//写sql语句自由查询

    await mssql.close();// close

    var pool = await getConnection(cfg);

    var request = pool.request();

    if (params) {

        for (var index in params) {

            if (typeof params[index] == "number") {

                request.input(index, mssql.Int, params[index]);

            } else if (typeof params[index] == "string") {

                request.input(index, mssql.NVarChar, params[index]);

            }

        }

    }

    var result = await request.query(sql);

    await mssql.close();// close

    return result;

};

module.exports.query = querySql;


