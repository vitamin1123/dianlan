const db = require('../db/db_mysql.js');
const dbconfig = require('../db/myconfig_ub.js')


module.exports = {
    

    

    async getPPList () {
        
        //let userlist = db.querySql(`select top 20 * from T_BD_Person where fid not in (select top 20 fid from T_BD_Person);`,{page:page,page_rows:page_rows},func_console_log).recordset;
        let res =await db.query(`select * from employee`,dbconfig);
       
        return res.recordset
    },

    
}
