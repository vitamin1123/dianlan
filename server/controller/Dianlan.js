const dbconfig = require('../db/myconfig_127.js')


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
    }

    
    

    

}

   
