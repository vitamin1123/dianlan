const dbconfig = require('../db/myconfig_127.js')
const db = require('../db/db_mysql.js');

module.exports = {
  // 检查projitem是否存在
  async checkExistence(dianlanid, proj, projItem) {
    try {
      const res = await db.query(
        `SELECT 1
         FROM dev.projitem
         WHERE dianlanid = ? AND proj = ? AND proj_item = ? AND state = 1
         LIMIT 1`,
        [dianlanid, proj, projItem]
      );
      return res.length > 0; // 返回是否存在
    } catch (error) {
      console.error('检查 projitem 是否存在 出错:', error);
      throw error;
    }
  },
  // 查询proj和proj_item
  async getProjItem(proj) {
    try {
      const res = await db.query(
        `SELECT 
            b.projname AS proj,
            a.itemname AS proj_item
         FROM 
            dev.proj_item a
         LEFT JOIN 
            dev.proj b ON a.projid = b.id
         WHERE 
            a.itemname = ?`,
        [proj]
      );
      return res[0]; // 返回proj和proj_item
    } catch (error) {
      console.error('查询 proj 和 proj_item 出错:', error);
      throw error;
    }
  },
   // 检查 workpack 是否存在并且状态为 0
   async checkWorkpackExist(wpid) {
    try {
      const res = await db.query(
        `SELECT COUNT(*) AS count 
         FROM dev.workpack 
         WHERE wpid = ?`, 
        [wpid]
      );
      return res[0].count;  // 返回匹配的数量
    } catch (error) {
      console.error('检查 workpack 出错:', error);
      throw error;
    }
  },

  async getAllSubWorkpacks(leaderUsercode) {
    try {
      let res = await db.query(`
WITH RECURSIVE subordinates AS (
    SELECT usercode, dleader
    FROM dev.user
    WHERE dleader = ?
    UNION
    SELECT u.usercode, u.dleader
    FROM user u
    JOIN subordinates s ON u.dleader = s.usercode
)
SELECT 
    wp.* 
FROM 
    dev.workpack wp
JOIN 
    dev.wp_user wpu ON wp.wpid = wpu.wp_id 
LEFT JOIN 
    subordinates s ON wpu.user = s.usercode;`, [leaderUsercode]);

      return res;
    } catch (error) {
      console.error('查询出错:', error);
      throw error;
    }
  },

  async getAllSub(usercode) {
    try {
      let res = await db.query(`
WITH RECURSIVE subordinates AS (
    SELECT usercode, dleader
    FROM dev.user
    WHERE dleader = ?
    UNION
    SELECT u.usercode, u.dleader
    FROM user u
    JOIN subordinates s ON u.dleader = s.usercode
)
SELECT wp.username,wp.usercode
FROM dev.user wp
JOIN subordinates s ON wp.usercode = s.usercode;`,
      [usercode],dbconfig)
      return res
    } catch (error) {
      console.error('查询出错:', error);
      throw error;
    }
  },

  async anaLaxian1(){
    try {
      let res = await db.query(`SELECT * 
FROM (
    SELECT 
        facilities_loca,
        COUNT(*) AS total_count,
        SUM(total_length) AS total_length_sum,
        COUNT(CASE WHEN state = 1 THEN 1 END) AS count_state_1,
        SUM(CASE WHEN state = 1 THEN total_length ELSE 0 END) AS sum_length_state_1
    FROM 
        dev.dianlan
    WHERE 
        proj = 'YZJ2022-1454'
    GROUP BY 
        facilities_loca
) AS subquery
WHERE count_state_1 != 0;`,[],dbconfig)
      return res
    } catch (error) {
      console.error('查询出错:', error);
      throw error;
    }
  },

  //anaLaxian
  async anaLaxian () {
    try {
      let res = await db.query(`SELECT b.username,sum(a.total_length) as legnth,count(b.username) as cnt FROM dev.dianlan a
left join dev.user b on a.last_fangxian = b.usercode
where a.state = 1 group by b.username`,[],dbconfig)
      return res
    } catch (error) {
      console.error('查询出错:', error);
      throw error;
    }
  },

  async delMyWork(id, userId) {
    try {
      // 查询工作包的当前状态
      const [workpack] = await db.query(
        `select a.wpid,a.wpowner,a.state,a.wpdate,a.dianlanstate,a.fin_user,a.finish_date,
b.proj,b.proj_item,b.dianlanid,b.last_fangxian,b.last_fangxian_date,b.last_ope,b.last_ope_date,b.last_fangxian_loca
from dev.workpack a left join dev.projitem b on a.dianlanid = b.id and b.state = 1 where b.dianlanid = ?`,
        [id],
        dbconfig
      );

      // 如果找不到记录
      if (!workpack) {
        return { success: false, message: 'Record not found' };
      }

      // 如果 dianlanstate 不是 0，表示记录已处理过，不允许删除
      if (workpack.dianlanstate == 0) {
        return { success: false, message: 'This record cannot be deleted because it has been processed.' };
      }

      // 如果 fin_user 不是当前用户，不能删除
      if (workpack.fin_user !== null && workpack.fin_user !== userId) {
        return { success: false, message: 'You are not authorized to delete this record.' };
      }

      // 执行删除操作
      await db.query(
        `update dev.workpack set dianlanstate=0,fin_user=null WHERE dianlanid = (select id from dev.projitem where dianlanid =? and state = 1)`,
        [id],
        dbconfig
      );

      return { success: true, message: 'Record deleted successfully.' };
    } catch (error) {
      console.error('Error in delMyWork:', error);
      throw error;
    }
  },
  // 检查并更新工作包
  async checkAndUpdateWorkpack(id, userId) {
    try {
      // 查询工作包的当前状态
      const [workpack] = await db.query(
        `select a.wpid,a.wpowner,a.state,a.wpdate,a.dianlanstate,a.fin_user,a.finish_date,
b.proj,b.proj_item,b.dianlanid,b.last_fangxian,b.last_fangxian_date,b.last_ope,b.last_ope_date,b.last_fangxian_loca
from dev.workpack a left join dev.projitem b on a.dianlanid = b.id and b.state = 1 where b.dianlanid = ?`,
        [id],
        dbconfig
      );

      // 如果找不到记录
      if (!workpack) {
        throw new Error('Record not found');
      }

      // 如果 dianlanstate 为 1 或者 fin_user 已是当前用户
      if (workpack.dianlanstate === 1 || workpack.fin_user === userId) {
        return { success: false, message: 'This record has already been processed by someone else or you have already processed it.' };
      }

      // 更新记录：设置 fin_user 为当前用户，dianlanstate 设置为 1
      await db.query(
        `UPDATE dev.workpack SET fin_user = ?, dianlanstate = 1, finish_date = NOW() WHERE dianlanid = (select id from dev.projitem where dianlanid =? and state = 1)`,
        [userId, id],
        dbconfig
      );

      return { success: true, message: 'Workpack updated successfully.' };
    } catch (error) {
      console.error('Error in checkAndUpdateWorkpack:', error);
      throw error;
    }
  },

  //getPaipWpList
//   SELECT 
//   a.*, 
//   e.username as user, 
//   c.*,
//   d.username as fin_user_name
// FROM 
//   dev.workpack a
//   LEFT JOIN dev.wp_user b ON a.wpid = b.wp_id
//   LEFT JOIN dev.user e on b.user = e.usercode
//   LEFT JOIN dev.dianlan c ON a.dianlanid = c.id
//   LEFT JOIN dev.user d ON a.fin_user = d.usercode
// WHERE 
//   a.wpowner = ? order by wpdate desc LIMIT 10 offset ?
  async getPaipWpList(user,page){
    try {
      let res = await db.query(`SELECT 
  a.*, 
  e.username AS user, 
  c.*, 
  d.username AS fin_user_name
FROM 
  dev.workpack a
  LEFT JOIN dev.wp_user b ON a.wpid = b.wp_id
  LEFT JOIN dev.user e ON b.user = e.usercode
  LEFT JOIN dev.dianlan c ON a.dianlanid = c.id
  LEFT JOIN dev.user d ON a.fin_user = d.usercode
WHERE 
  a.wpid IN (
    SELECT wpid
    FROM (
      SELECT DISTINCT wpid, wpdate
      FROM dev.workpack
      WHERE wpowner = ?
      ORDER BY wpdate DESC
      LIMIT 10 OFFSET ?
    ) AS temp
  )
ORDER BY a.wpdate DESC
LIMIT 0, 1000;`,[user,String(page)],dbconfig)
  let countRes = await db.query(`SELECT 
  count(1) as totalCount
FROM 
  dev.workpack a
  LEFT JOIN dev.wp_user b ON a.wpid = b.wp_id
  LEFT JOIN dev.dianlan c ON a.dianlanid = c.id
  LEFT JOIN dev.user d ON a.fin_user = d.usercode
WHERE 
  a.wpowner = ?`,[user],dbconfig)
  return {
    data: res,
    totalCount: countRes[0].totalCount // 总数是查询结果的第一个字段
  };
    
    } catch (error) {
      console.error('查询出错:', error);
      throw error;
    }
  },
  // getMyWpList
  async    getMyWpList(ope,qdate) {
    try {
      let res = await db.query(`SELECT 
  a.*, 
  b.user, 
  c.*,
  d.username as fin_user_name
FROM 
  dev.workpack a
  LEFT JOIN dev.wp_user b ON a.wpid = b.wp_id
  left join dev.projitem e on a.dianlanid = e.id
  LEFT JOIN dev.dianlan c ON e.dianlanid = c.id
  LEFT JOIN dev.user d ON a.fin_user = d.usercode
WHERE 
  b.user = ? 
  AND to_days(wpdate) = to_days(?)  ;`,[ope,qdate],dbconfig)
//   UNION 

// SELECT 
//   a.*, 
//   b.user, 
//   c.*,
//   d.username as fin_user_name
// FROM 
//   dev.workpack a
//   LEFT JOIN dev.wp_user b ON a.wpid = b.wp_id
//   LEFT JOIN dev.dianlan c ON a.dianlanid = c.id
//   LEFT JOIN dev.user d ON a.fin_user = d.usercode
// WHERE 
//   b.user = ? 
//   AND a.dianlanstate = 0    
//   AND to_days(wpdate) < to_days(?)
    
//       let res = await db.query(`select a.*,b.user,c.* from dev.workpack a left join dev.wp_user b on a.wpid = b.wp_id
// left join dev.dianlan c on a.dianlanid = c.id
// where b.user = ? and  to_days(wpdate) = to_days(?)
// union (
// select a.*,b.user,c.* from dev.workpack a left join dev.wp_user b on a.wpid = b.wp_id
// left join dev.dianlan c on a.dianlanid = c.id
// where b.user = '10030203' and a.dianlanstate = 0);`,[ope,qdate],dbconfig)
      //console.log('contro_res:  ',res)
      return res
    } catch (error) {
      console.error('查询出错:', error);
      throw error;
    }
  },
  async getValidDianlanIds(dianlanIds) {
    console.log('看看dianlanIds: ', dianlanIds);
    try {
        // 构造 SQL 查询
        const placeholders = dianlanIds.map(() => '?').join(','); // 构造占位符 (?, ?, ...)
        const sql = `SELECT id FROM dev.projitem WHERE state = 1 AND dianlanid IN (${placeholders})`;

        // 构造完整的调试 SQL
        // const debugSql = sql.replace(/\?/g, (_, index) => `'${dianlanIds[index]}'`);
        // console.log('看看执行的完整 SQL: ', debugSql);

        // 执行查询
        const res = await db.query(sql, dianlanIds, dbconfig);
        return res.map(row => row.id); // 返回有效的 ID 数组
    } catch (error) {
        console.error('查询有效电缆ID出错:', error);
        throw error;
    }
 },

    async getAllUser(){
        try{
          let res = await db.query(`select a.id,a.usercode,a.username from dev.user a`, [], dbconfig);
          return res;
        }catch (error) {
          console.error('查询出错:', error);
          throw error;
        }
          
    },
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
      let res = await db.query(`select a.*,b.id as itemid,b.itemname from dev.loca a left join dev.loca_item b on a.id = b.locaid
 where a.id in (select loca from dev.loca_user where user = ?) and a.state = 1 and b.state = 1`,[ ope],dbconfig)
      //console.log('contro_res:  ',res)
      return res
    } catch (error) {
      console.error('查询出错:', error);
      throw error;
    }
  },

  async addLaxian (xian_id, locaitem, ope) {
    //console.log('emp_code: ',emp_code)
    try {
      let res = await db.query(`update dev.dianlan set last_fangxian = ?,last_fangxian_time=now(),last_fangxian_loca=?  where id = ?`,[ope, locaitem,xian_id],dbconfig)
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
//addLocaUser
async addLocaUser(loca,user){
  try {
    let res = await db.query(`insert into dev.loca_user (loca,user) values (?,?) `,[loca,user], dbconfig);
    return res;
  } catch (error) {
    throw error;  // 如果有错误则抛出到路由处理
  }
},
//delLocaUser
async delLocaUser(loca,user){
  try {
    let res = await db.query(`delete from dev.loca_user where loca=? and user=? `,[loca,user], dbconfig);
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

async projMod(name,id) {
  try {
    let res = await db.query(`update dev.proj set projname =? where id =? `,[name,id], dbconfig);
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

async projItemMod(id,name) {
  try {
    let res = await db.query(`update dev.proj_item set itemname =? where id =? `,[name,id], dbconfig);
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

async projItemDel(id) {
  try {
    let res = await db.query(`update dev.proj_item set state = 0 where id =? `,[id], dbconfig);
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
async addProj(name) {
  try {
    let res = await db.query(`insert into dev.proj (projname) values (?)`, [name], dbconfig);
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

async addProjItem (id,name) {
  try {
    let res = await db.query(`insert into dev.proj_item (projid,itemname,state) values (?,?,1) `,[id,name], dbconfig);
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
// projItem
async projItem(id) {
  try {
    let res = await db.query(`select * from dev.proj_item where projid =? and state = 1 `,[id], dbconfig);
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

async projList() {
  try {
    let res = await db.query(`select * from dev.proj where state = 1 order by id `,[], dbconfig);
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

async projDel(id) {
  try {
    let res = await db.query(`update dev.proj set state = 0 where id =? `,[id], dbconfig);
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

    async searchDl(company, proj, daihao, model, spec, facilities_name, facilities_loca,total_length,sysname ,start) {
        let conditions = [];
        let values = [];
        // 先查询 projname
        let projName = '';
        if (proj !== undefined && proj !== '') {
          const projQuery = `SELECT a.projname 
                            FROM dev.proj a 
                            LEFT JOIN dev.proj_item b ON a.id = b.projid 
                            WHERE b.itemname = ?`;
          try {
            const projRes = await db.query(projQuery, [proj], dbconfig);
            if (projRes.length > 0) {
              projName = projRes[0].projname;
            } else {
              throw new Error('未找到对应的 projname');
            }
          } catch (err) {
            console.error('查询 projname 出错:', err);
            throw err;
          }
        }
        // 拼接完整的 SQL 查询
        let sql = `SELECT a.id,a.model,a.specification,a.proj,a.facilities,a.company,a.daihao,a.facilities_name,a.facilities_loca,h.state,a.total_length,a.sysname,
        a.last_fangxian_loca as ori_fangxian_loca,
        h.last_fangxian,h.last_fangxian_date,h.last_ope,h.last_ope_date,h.last_fangxian_loca,b.username as fangxianren,c.username as last_operator,d.price as baseprice,e.price as fa_price,g.username as paip,g.usercode as paip_code  from dev.dianlan a `;
        let countSql = `SELECT COUNT(*) as totalCount from dev.dianlan a `;
      
        // 根据各个字段的值拼接 WHERE 条件
        if (company !== undefined && company !== '') {
          conditions.push('a.company = ?');
          values.push(company);
        }
        if (projName !== undefined && projName !== '') {
          conditions.push('a.proj = ?');
          values.push(projName);
        }
        if (daihao !== undefined && daihao !== '') {
          conditions.push('a.daihao = ?');
          values.push(daihao);
        }
        if (model !== undefined && model !== '') {
          conditions.push('a.model = ?');
          values.push(model);
        }
        if (spec !== undefined && spec !== '') {
          conditions.push('a.specification = ?');
          values.push(spec);
        }
        if (facilities_name !== undefined && facilities_name !== '') {
          conditions.push('a.facilities_name = ?');
          values.push(facilities_name);
        }
        if (facilities_loca!== undefined && facilities_loca!== '') {
          conditions.push('a.facilities_loca =?');
          values.push(facilities_loca);
        }
        if (total_length!== undefined && total_length!== '') {
          conditions.push('a.total_length =?');
          values.push(total_length);
        }
        if (sysname!== undefined && sysname!== '') {
          conditions.push('a.sysname =?');
          values.push(sysname);
        }
        sql += ` left join dev.projitem h on a.id = h.dianlanid AND h.state = 1
        left join dev.baseprice d on a.specification = d.model 
        left join dev.user b on h.last_fangxian = b.usercode 
        left join dev.user c on h.last_ope = c.usercode
        left join dev.epprice e on a.facilities = e.ep
        left join dev.workpack f on a.id = f.dianlanid 
        left join dev.user g on f.wpowner = g.usercode
        `;
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

    async searchCompany(sw,company, proj, daihao, model, spec, facilities,facilities_loca,total_length,sysname) {
        console.log('搜sql索参数: ',company, proj, daihao, model, spec, facilities,facilities_loca,total_length,sysname)
        const adic = {
            '公司':'distinct a.company',
            '船号':'distinct(c.itemname) as proj',
            '代号':'distinct a.daihao',
            '型号':'distinct a.model',
            '规格':'distinct a.specification',
            '设备':'distinct a.facilities_name',
            '设备地点':'distinct a.facilities_loca',
            '总线长':'distinct a.total_length',
            '系统名':'distinct a.sysname'
        }
        // 初始化 WHERE 条件数组
        let conditions = [];
        let values = [];
        // 拼接完整的 SQL 查询
        let sql = `SELECT ${adic[sw]} from dev.dianlan a left join dev.proj b on a.proj = b.projname left join dev.proj_item c on b.id = c.projid `;
        // 根据各个字段的值拼接 WHERE 条件
        if (company !== undefined && company !== '') {
            conditions.push('a.company = ?');
            values.push(company);
        }
        if (proj !== undefined && proj !== '') {
            conditions.push('instr(c.itemname,?)>0');
            values.push(proj);
        }
        if (daihao !== undefined && daihao !== '') {
            conditions.push('instr(a.daihao,?)>0');
            values.push(daihao);
        }
        if (model !== undefined && model !== '') {
            conditions.push('a.model = ?');
            values.push(model);
        }
        if (spec !== undefined && spec !== '') {
            conditions.push('instr(a.specification,?)>0');
            values.push(spec);
        }
        if (facilities !== undefined && facilities !== '') {
            conditions.push('instr(a.facilities_name,?)>0');
            values.push(facilities);
        }
        if (facilities_loca!== undefined && facilities_loca!== '') {
            conditions.push('instr(a.facilities_loca,?)>0');
            values.push(facilities_loca);
        }
        if (total_length!== undefined && total_length!== '') {
            conditions.push('instr(a.total_length,?)>0');
            values.push(total_length);
        }
        if (sysname!== undefined && sysname!== '') {
            conditions.push('instr(a.sysname,?)>0');
            values.push(sysname);
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

   
