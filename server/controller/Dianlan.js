const dbconfig = require('../db/myconfig_127.js')
const db = require('../db/db_mysql.js');

module.exports = {
    
    async getUser (usercode) {
        //console.log('emp_code: ',emp_code)
        try{
        let res = await db.query(`select a.username,a.usercode,b.rolename as rolename,a.role as roleid  
from dev.user a left join dev.role b on 
a.role = b.id where a.usercode = ? and a.state = 1`,[usercode],dbconfig)
        //console.log('contro_res:  ',res)
        return res
      } catch (error) {
        console.error('查询出错:', error);
        throw error;
      }
    },
    async searchLoca ( ope) {
      try {
      let res = await db.query(`select a.username,c.itemname from dev.user a 
left join dev.loca b on a.loca = b.id left join dev.loca_item c 
on b.id = c.locaid where a.usercode = ?`,[ ope],dbconfig)
      //console.log('contro_res:  ',res)
      return res
    } catch (error) {
      console.error('查询出错:', error);
      throw error;
    }
  },

  async addLaxian (xian_id,proj,ope) {
    //console.log('emp_code: ',emp_code)
    try {
      let res = await db.query(`update dev.dianlan set last_fangxian = ?,last_fangxian_time=now()  where id = ?`,[ope, xian_id],dbconfig)
      //console.log('contro_res:  ',res)
      return res;
    }catch (error) {
      throw error;  // 如果有错误则抛出到路由处理
    }
  },


async modUser (sw,type,user) {
  let res;
  if (type == '区域'){
    res = await db.query(`update dev.user set loca =? where usercode =? `,[sw, user.usercode],dbconfig)
  }else if (type == '上级'){
    res = await db.query(`update dev.user set dleader =? where usercode =? `,[sw, user.usercode],dbconfig)
  }else if (type == '角色'){
    res = await db.query(`update dev.user set role =? where usercode =? `,[sw, user.usercode],dbconfig)
  }
  return res
},

//getUserList 
async getUserList(sw, page) {
  console.log('看看page: ', page);
  
  let res;
  let countRes;

  if (sw && sw.length > 0) {
    // 查询用户列表
    res = await db.query(`
      SELECT a.id,a.usercode,a.username,a.role,case a.role when 1 then '超级管理员' when 2 then '管理员' when 3 then '生产主管'
when 4 then '班组长' else '施工员'  end as rolename,a.state,a.dleader,
   b.username AS leadername
      FROM dev.user a
      LEFT JOIN dev.user b ON a.dleader = b.usercode
    `, [], dbconfig);

    // 查询总数
    countRes = await db.query(`
      SELECT COUNT(*) AS totalCount
      FROM dev.user a
      LEFT JOIN dev.user b ON a.dleader = b.usercode
    `, [], dbconfig);

  } else {
    // 查询带分页的用户列表
    res = await db.query(`
      SELECT a.id,a.usercode,a.username,a.role,case a.role when 1 then '超级管理员' when 2 then '管理员' when 3 then '生产主管'
when 4 then '班组长' else '施工员'  end as rolename,a.state,a.dleader,
   b.username AS leadername
      FROM dev.user a
      LEFT JOIN dev.user b ON a.dleader = b.usercode
      LIMIT 10 OFFSET ?
    `, [page + ''], dbconfig);

    // 查询总数
    countRes = await db.query(`
      SELECT COUNT(*) AS totalCount
      FROM dev.user a
      LEFT JOIN dev.user b ON a.dleader = b.usercode
    `, [], dbconfig);
  }

  return {
    data: res,
    totalCount: countRes[0].totalCount // 总数是查询结果的第一个字段
  };
},


async addUser(username,usercode,role,shangji,quyu){
  // 初始化字段和值
  let columns = ['username', 'usercode', 'role', 'state'];
  let values = ['?', '?', '?', '1'];
  let params = [username, usercode, role];

  // 动态拼接字段和参数
  if (shangji) {
    columns.push('dleader');
    values.push('?');
    params.push(shangji);
  }

  if (quyu) {
    columns.push('loca');
    values.push('?');
    params.push(quyu);
  }

  // 构造 SQL 语句
  let sql = `INSERT INTO dev.user (${columns.join(', ')}) VALUES (${values.join(', ')})`;

  // 执行数据库查询
  try {
    let res = await db.query(sql, params, dbconfig);
    return res;
  } catch (error) {
    throw error;  // 如果有错误则抛出到路由处理
  }
  
},

// getUserList
async getLeaderList (type) {
  let res
  if (type == '上级'){
    res = await db.query(`select * from dev.user where role in (2,3,4)  `,[],dbconfig)
  }else if (type == '区域'){
    res = await db.query(`select id as usercode,locaname as username from dev.loca `,[],dbconfig)
  }
  
  //console.log('contro_res:  ',res)
  return res
},

async getlocaUser(id){
  try {
    let res = await db.query(`select a.*,b.username from dev.loca_user a left join dev.user b on a.user = b.usercode where loca =? `,[id], dbconfig);
    return res;
  } catch (error) {
    throw error;  // 如果有错误则抛出到路由处理
  }
},

async getLocaUserList(){
  try {
    let res = await db.query(`select a.* from dev.user a where a.role < 5 `,[], dbconfig);
    return res;
  } catch (error) {
    throw error;  // 如果有错误则抛出到路由处理
  }
},
//searchRela
async searchRela(id){
  try {
    let res = await db.query(`SELECT a.loca,a.user as code,b.id as userid,b.username as name FROM dev.loca_user a left join dev.user b on a.user = b.usercode where a.loca =? `,[id], dbconfig);
    return res;
  } catch (error) {
    throw error;  // 如果有错误则抛出到路由处理
  }
},

async areaMod(name,id) {
  try {
    let res = await db.query(`update dev.loca set locaname =? where id =? `,[name,id], dbconfig);
    return res;
  } catch (error) {
    throw error;  // 如果有错误则抛出到路由处理
  }
},
async areaItemMod(id,name) {
  try {
    let res = await db.query(`update dev.loca_item set itemname =? where id =? `,[name,id], dbconfig);
    return res;
  } catch (error) {
    throw error;  // 如果有错误则抛出到路由处理
  }
},

async areaItemDel(id) {
  try {
    let res = await db.query(`update dev.loca_item set state = 0 where id =? `,[id], dbconfig);
    return res;
  } catch (error) {
    throw error;  // 如果有错误则抛出到路由处理
  }
},
async addArea(name){
  try {
    let res = await db.query(`insert into dev.loca (locaname) values (?)`, [name], dbconfig);
    return res;
  } catch (error) {
    throw error;  // 如果有错误则抛出到路由处理
  }
},
async addAreaItem (id,name) {
  try {
    let res = await db.query(`insert into dev.loca_item (locaid,itemname,state) values (?,?,1) `,[id,name], dbconfig);
    return res;
  } catch (error) {
    throw error;  // 如果有错误则抛出到路由处理
  }
  
},
async areaItem (id) {
  try {
    let res = await db.query(`select * from dev.loca_item where locaid =? and state = 1 `,[id], dbconfig);
    return res;
  } catch (error) {
    throw error;  // 如果有错误则抛出到路由处理
  }
  
},

async areaList () {
  try {
    let res = await db.query(`select * from dev.loca where state = 1 order by id `,[], dbconfig);
    return res;
  } catch (error) {
    throw error;  // 如果有错误则抛出到路由处理
  }
  
},

async areaDel(id) {
  try {
    let res = await db.query(`update dev.loca set state = 0 where id =? `,[id], dbconfig);
    return res;
  } catch (error) {
    throw error;  // 如果有错误则抛出到路由处理
  }
},

async searchCode (code) {
  try {
    let res = await db.query(`select * from dev.user where usercode = ? `,[code], dbconfig);
    return res;
  } catch (error) {
    throw error;  // 如果有错误则抛出到路由处理
  }
  
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
        try {
            let res = await db.query(sql, values, dbconfig);
            return res;
        } catch (error) {
            console.error('查询出错:', error);
            throw error;
        }
        
    }
}

   
