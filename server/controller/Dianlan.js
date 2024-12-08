const dbconfig = require('../db/myconfig_127.js')
const db = require('../db/db_mysql.js');

module.exports = {
    

    
    
    async getPwd (user) {
        //console.log('emp_code: ',emp_code)
        let res = await db.query(`select user,password,name from dev.user where user = ?`,[user],dbconfig)
        //console.log('contro_res:  ',res)
        return res
    },
    async getFileCount (doc) {
        //console.log('emp_code: ',emp_code)
        let res = await db.query(`select 1 as c from dev.doc_record where doc = ? limit 1`,[doc],dbconfig)
        //console.log('contro_res:  ',res)
        return res
    },
    async getUser (usercode) {
        //console.log('emp_code: ',emp_code)
        let res = await db.query(`select username,case role when 1 then '管理员' when 2 then '组长' when 3 then '员工' end as rolename from dev.user where usercode = ? and state = 1`,[usercode],dbconfig)
        //console.log('contro_res:  ',res)
        return res
    }

    
    

    

}

   
