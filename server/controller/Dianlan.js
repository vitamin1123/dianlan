const dbconfig = require('../db/myconfig_127.js')
const db = require('../db/db_mysql.js');

module.exports = {
    
    async getUser (usercode) {
        //console.log('emp_code: ',emp_code)
        let res = await db.query(`select a.username,a.usercode,b.rolename as rolename,a.role as roleid  
from dev.user a left join dev.role b on 
a.role = b.id where a.usercode = ? and a.state = 1`,[usercode],dbconfig)
        //console.log('contro_res:  ',res)
        return res
    },
    async searchLoca (proj, ope) {
      //console.log('emp_code: ',emp_code)
      let res = await db.query(`select a.username,c.proj,c.itemname from dev.user a 
left join dev.loca b on a.loca = b.id left join dev.loca_item c 
on b.id = c.locaid where c.proj = ? and a.usercode = ?`,[proj, ope],dbconfig)
      //console.log('contro_res:  ',res)
      return res
  },

  async addLaxian (xian_id,proj,ope) {
    //console.log('emp_code: ',emp_code)
    let res = await db.query(`update dev.dianlan set last_fangxian = ?,last_fangxian_time=now()  where id = ?`,[ope, xian_id],dbconfig)
    //console.log('contro_res:  ',res)
    return res
},

//getUserList 
async getUserList (page) {
  console.log('看看page: ',page)
  let res = await db.query(`select a.*,b.username as leadername,c.locaname from dev.user a left join dev.user b on a.dleader = b.usercode left join dev.loca c on a.loca = c.id LIMIT 10 OFFSET ? `,[page+''],dbconfig)
  //console.log('contro_res:  ',res)
  return res
},

// getUserList
async getLeaderList () {

  let res = await db.query(`select * from dev.user where role in (2,3)  `,[],dbconfig)
  //console.log('contro_res:  ',res)
  return res
},

async searchCode (code) {
  let res = await db.query(`select * from dev.user where usercode = ? `,[code],dbconfig)
  //console.log('contro_res:  ',res)
  return res
},

    async searchDl(company, proj, daihao, model, spec, facilities_name, start) {
        let conditions = [];
        let values = [];
        // 拼接完整的 SQL 查询
        let sql = `SELECT a.*,b.username as fangxianren,c.username as last_operator,d.price as baseprice  from dev.dianlan a `;
        let countSql = `SELECT COUNT(*) as totalCount from dev.dianlan `;
      
        // 根据各个字段的值拼接 WHERE 条件
        if (company !== undefined && company !== '') {
          conditions.push('company = ?');
          values.push(company);
        }
        if (proj !== undefined && proj !== '') {
          conditions.push('proj = ?');
          values.push(proj);
        }
        if (daihao !== undefined && daihao !== '') {
          conditions.push('daihao = ?');
          values.push(daihao);
        }
        if (model !== undefined && model !== '') {
          conditions.push('model = ?');
          values.push(model);
        }
        if (spec !== undefined && spec !== '') {
          conditions.push('specification = ?');
          values.push(spec);
        }
        if (facilities_name !== undefined && facilities_name !== '') {
          conditions.push('facilities_name = ?');
          values.push(facilities_name);
        }
        sql += ` left join dev.baseprice d on a.specification = d.model left join dev.user b on a.last_fangxian = b.usercode left join dev.user c on a.last_ope = c.usercode `;
        // 如果有条件，拼接 WHERE 子句
        if (conditions.length > 0) {
          const conditionString = conditions.join(' AND ');
          sql += ' WHERE ' + conditionString;
          countSql += ' WHERE ' + conditionString;
        }
      
        // 添加分页支持，LIMIT 10，OFFSET start
        const limit = 10;
        const offset = start || 0;
        
        sql += ` LIMIT ${limit} OFFSET ${offset}`;
      
        console.log('sql: ', sql, values);
        console.log('countSql: ', countSql, values);
      
        try {
          // 执行查询以获取分页数据
          let res = await db.query(sql, values, dbconfig);
      
          // 执行查询以获取符合条件的总数
          let countRes = await db.query(countSql, values, dbconfig);
      
          // 返回数据和符合条件的总数
          return {
            data: res,
            totalCount: countRes[0].totalCount, // 总数是查询结果的第一个字段
          };
        } catch (err) {
          console.error('查询出错:', err);
          throw err;
        }
      },
      

    // async searchDl(company, proj, daihao, model, spec, facilities, start){
    //     let conditions = [];
    //     let values = [];
    //     // 拼接完整的 SQL 查询
    //     let sql = `SELECT * from dev.dianlan `;
    //     // 根据各个字段的值拼接 WHERE 条件
    //     if (company !== undefined && company !== '') {
    //         conditions.push('company = ?');
    //         values.push(company);
    //     }
    //     if (proj !== undefined && proj !== '') {
    //         conditions.push('proj = ?');
    //         values.push(proj);
    //     }
    //     if (daihao !== undefined && daihao !== '') {
    //         conditions.push('daihao = ?');
    //         values.push(daihao);
    //     }
    //     if (model !== undefined && model !== '') {
    //         conditions.push('model = ?');
    //         values.push(model);
    //     }
    //     if (spec !== undefined && spec !== '') {
    //         conditions.push('specification = ?');
    //         values.push(spec);
    //     }
    //     if (facilities !== undefined && facilities !== '') {
    //         conditions.push('facilities = ?');
    //         values.push(facilities);
    //     }

        
        
    //     // 如果有条件，拼接 WHERE 子句
    //     if (conditions.length > 0) {
    //         sql += ' WHERE ' + conditions.join(' AND ');
    //     }
    //     console.log('sql: ',sql,values)
    //     // 执行查询
    //     let res = await db.query(sql, values, dbconfig);
    //     return res;
    // },

    async searchCompany(sw,company, proj, daihao, model, spec, facilities) {
        console.log('搜sql索参数: ',company, proj, daihao, model, spec, facilities)
        const adic = {
            '公司':'distinct company',
            '船号':'distinct proj',
            '代号':'distinct daihao',
            '型号':'distinct model',
            '规格':'distinct specification',
            '设备':'distinct facilities_name'
            
        }
        // 初始化 WHERE 条件数组
        let conditions = [];
        let values = [];
        // 拼接完整的 SQL 查询
        let sql = `SELECT ${adic[sw]} from dev.dianlan `;
        // 根据各个字段的值拼接 WHERE 条件
        if (company !== undefined && company !== '') {
            conditions.push('company = ?');
            values.push(company);
        }
        if (proj !== undefined && proj !== '') {
            conditions.push('instr(proj,?)>0');
            values.push(proj);
        }
        if (daihao !== undefined && daihao !== '') {
            conditions.push('instr(daihao,?)>0');
            values.push(daihao);
        }
        if (model !== undefined && model !== '') {
            conditions.push('model = ?');
            values.push(model);
        }
        if (spec !== undefined && spec !== '') {
            conditions.push('instr(specification,?)>0');
            values.push(spec);
        }
        if (facilities !== undefined && facilities !== '') {
            conditions.push('instr(facilities_name,?)>0');
            values.push(facilities);
        }

        
        
        // 如果有条件，拼接 WHERE 子句
        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }
        console.log('sql: ',sql,values)
        // 执行查询
        let res = await db.query(sql, values, dbconfig);
        return res;
    }
}

   
