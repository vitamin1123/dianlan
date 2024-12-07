const db = require('../db/db.js');
const db_oa_test = require('../db/db_oa_test.js');
const dbconfig_110 = require('../db/msconfig_110.js')


var SyncVehicles = async function() {
    
        //console.log('param: ',param)
        //let userlist = db.querySql(`select top 20 * from T_BD_Person where fid not in (select top 20 fid from T_BD_Person);`,{page:page,page_rows:page_rows},func_console_log).recordset;
        //let userlist =await db.query(`select top (@page_rows) * from T_BD_Person where fid not in (select top(@page) fid from T_BD_Person)`,{page:page,page_rows:page_rows});
        let reslist =await db.query(`select * from vehicles`,null,dbconfig_110)

        return reslist.recordset
    
}

module.exports = {
    SyncVehicles: SyncVehicles

   
};
