const db = require('../db/db.js');

const dbconfig = require('../db/msconfig_90.js')


module.exports = {
    //新增用户
    // async addUser (name,age) {
    //     let res = await SQLQuery(`insert into users (name,age) values ('${name}','${age}')`);
    //     return res
    // },
    //获取用户列表

    
    
    async getOpenID (emp_code) {
        //console.log('emp_code: ',emp_code)
        let res = await db.query(`select Staff_Name,Staff_RealName,Staff_WxOpenID from [yzjpt2023].[dbo].[Lb_Staff] where Staff_Name = @code;`,{code:emp_code},dbconfig)
        //console.log('res.recordset',res)
        return res.recordset
    },

    
}
