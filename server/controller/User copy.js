const db = require('../db/db.js');
const dbconfig = require('../db/msconfig_oa.js')


module.exports = {
    

    

    async getVendorProjList () {
        
        //let userlist = db.querySql(`select top 20 * from T_BD_Person where fid not in (select top 20 fid from T_BD_Person);`,{page:page,page_rows:page_rows},func_console_log).recordset;
        let res =await db.query(`select field0002 from formson_1682`,dbconfig);
       
        return res.recordset
    },

    
}
