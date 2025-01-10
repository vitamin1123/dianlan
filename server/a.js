const Koa = require('koa');
const app = new Koa();
const Router = require('koa-router');
const fs = require('fs');
const path = require('path');
const koaStatic = require('koa-static');
const historyFallback = require('connect-history-api-fallback');
const koaConnect = require('koa-connect'); // 使用 koa-connect 来包装 connect-history-api-fallback
const { koaBody } = require('koa-body');
const jwt = require('koa-jwt');
const jwt1 = require('jsonwebtoken');
const bodyParser = require('koa-bodyparser');
const XLSX = require('xlsx');
const base64 = require('base-64')
const crypto = require('crypto');
const mysql_trans = require("./db/mysql_trans_110.js");
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const util1 = require('./util/pinyin');
const router = new Router();

const Dianlan = require('./controller/Dianlan') ;
const { processExcelAndInsert } = require('./parse_dianlan.js'); // 替换为实际路径




const doc_path = '/home/dev/mp/docs/'
const JWT_SECRET = 'e2657e6a-7038-45db-91d4-01dbaa47c9aa'

// 使用 connect-history-api-fallback，通过 koa-connect 来包装
app.use(koaConnect(historyFallback()));

// 提供静态文件服务
app.use(koaStatic('C:/Users/xyy/Desktop/dianlan/dist')); // 假设你的静态文件在该目录下
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
app.use(koaBody({  
  multipart: true,  
  formidable: {  
    uploadDir: uploadDir, // 设置文件上传目录  
    keepExtensions: true, // 保持文件扩展名  
    maxFieldsSize: 20 * 1024 * 1024, // 最大字段大小，20MB  
  },  
})); 

app.use(async (ctx, next) => {
  return next().catch((err) => {
    if (401 == err.status) {
      ctx.body = {
        code: 50001,
        message: '用户鉴权失败',
      };
    } else {
      throw err;
    }
  });
});

app.use(jwt({ secret: JWT_SECRET }).unless({ 
  path: [/^\/public/, /\/login/, /^\/xyy/] 
}));

app.use(bodyParser())
app.use(router.routes())
app.use(router.allowedMethods())

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

router.post('/api/user/login', async (ctx, next) => {
  
  const { name, password } = ctx.request.body;
  try {  
    const secret = JWT_SECRET;
    const hash = crypto.createHmac('sha256', secret)
                    .update(base64.decode(password))
                    .digest('hex');
    var hashedPassword = await Restuser.getPwd(name)
    if (hashedPassword.length > 0 && hashedPassword[0]['password']===hash) {  
      
      const token = jwt1.sign({ uid: name }, JWT_SECRET, { expiresIn: '72000s' }); 
  
      ctx.body = {  
        "code": 200,  
        "message": "登录成功",  
        "data": {  
          "code": 0,  
          "token": token,  
          "name": hashedPassword[0]['name']
        }  
      };  
    } else {  
      ctx.status = 200; // 未授权  
      ctx.body = {  
        "code": 200,  
        "message": "用户名或密码错误"  ,
        "data":{
          "code":401
        }
      };  
    }  
  } catch (error) {  
    ctx.status = 500; // 服务器内部错误  
    ctx.body = {  
      "code": 500,  
      "message": "服务器错误" ,
      "data":{
          "code":500
        } 
    };  
    console.error('Error during login:', error);  
  }  
});

router.post('/api/sso/login' ,async (ctx, next) => {
  
  const { name, password, user } = ctx.request.body;
  if (!user) {
    ctx.status = 400;
    ctx.body = {
      code: 400,
      message: '用户名和密码不能为空'
    };
    return;
  }
  try {  
    const secret = JWT_SECRET;
    const hash = crypto.createHmac('sha256', secret)
                    .update(base64.decode(password))
                    .digest('hex');
    var hashedPassword = await Restuser.getPwd(name)
    if (hashedPassword.length > 0 && hashedPassword[0]['password']===hash) {  
      
      const token = jwt1.sign({ uid: user }, JWT_SECRET, { expiresIn: '72000s' }); 
  
      ctx.body = {  
        "code": 200,  
        "message": "登录成功",  
        "data": {  
          "code": 0,  
          "token": token,  
          "name": user
        }  
      };  
    } else {  
      ctx.status = 401; // 未授权  
      ctx.body = {  
        "code": 401,  
        "message": "用户名或密码错误"  
      };  
    }  
  } catch (error) {  
    ctx.status = 500; // 服务器内部错误  
    ctx.body = {  
      "code": 500,  
      "message": "服务器错误"  
    };  
    console.error('Error during login:', error);  
  }  
});

function isEmpty(value) {  
  return value === null || value === undefined || value === "" || value === 0 || isNaN(value) || value === false;  
} 

router.get('/public/api/gaga', async (ctx, next) => {
  ctx.body = {
    "code": 0,
    "data": "我的天哪"
  }
});
///public/api/dianlan_del_all
router.post('/public/api/dianlan_del_all', async (ctx, next) => {
  const { proj } = ctx.request.body;
  const res = await Dianlan.deldianlanAll(proj)
  ctx.body = {
    "code": 0,
    "data": res
  }
});
///public/api/upload-dianlan
router.post('/public/api/upload-dianlan', async (ctx) => {
  const file = ctx.request.files.file; // 获取上传的文件对象
  const { projname } = ctx.request.body;
  console.log('projname',projname);
  if (!file) {
    ctx.status = 400;
    ctx.body = { success: false, message: '未接收到文件' };
    return;
  }
  const filePath = file.filepath; // 临时文件路径
  console.log('上传的文件路径:', filePath); // 打印文件路径
  // 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    console.error('文件不存在:', filePath);
    ctx.status = 400;
    ctx.body = { success: false, message: '源文件不存在' };
    return;
  }
  try {
    await processExcelAndInsert(filePath,projname)
    ctx.body = { success: true, message: '文件处理成功' };
   
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: '文件处理失败', error: error.message };
  }
  finally {
    // 删除临时文件
    try {
      fs.unlinkSync(filePath);
      console.log('临时文件已删除:', filePath);
    } catch (err) {
      console.error('删除文件失败:', err.message);
    }
  }
});
// public/api/upload-epprice
router.post('/public/api/upload-epprice', async (ctx) => {
  const file = ctx.request.files.file; // 获取上传的文件对象
  
  if (!file) {
    ctx.status = 400;
    ctx.body = { success: false, message: '未接收到文件' };
    return;
  }
  const filePath = file.filepath; // 临时文件路径
  console.log('上传的文件路径:', filePath); // 打印文件路径
  // 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    console.error('文件不存在:', filePath);
    ctx.status = 400;
    ctx.body = { success: false, message: '源文件不存在' };
    return;
  }
  try {
    // 读取文件内容
    const fileBuffer = fs.readFileSync(filePath);
    // 使用 XLSX 解析文件内容
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0]; // 获取第一个工作表的名称
    const sheet = workbook.Sheets[sheetName];
    // 将表格内容转换为 JSON，从第二行开始，提取第一列和第二列
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    // 过滤并验证数据
    const result = data.slice(1) // 跳过标题行
      .filter(row => {
        const ep = row[0];
        const price = row[1];
        // 检查第一列长度是否不超过45，第二列是否是 float
        return typeof ep === 'string' && ep.length <= 45 && !isNaN(parseFloat(price));
      })
      .map(row => ({
        ep: row[0].toUpperCase(), // 第一列转为大写
        price: parseFloat(row[1]), // 第二列转为 float
      }));
    await Dianlan.insertPriceBatch(result);
    ctx.body = {
      success: true,
      message: '文件解析成功',
      // data: result,
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: '文件处理失败', error: error.message };
  }
  finally {
    // 删除临时文件
    try {
      fs.unlinkSync(filePath);
      console.log('临时文件已删除:', filePath);
    } catch (err) {
      console.error('删除文件失败:', err.message);
    }
  }
});
// public/api/upload-baseprice
router.post('/public/api/upload-baseprice', async (ctx) => {
  const file = ctx.request.files.file; // 获取上传的文件对象
  if (!file) {
    ctx.status = 400;
    ctx.body = { success: false, message: '未接收到文件' };
    return;
  }

  const filePath = file.filepath; // 临时文件路径
  console.log('上传的文件路径:', filePath); // 打印文件路径

  // 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    console.error('文件不存在:', filePath);
    ctx.status = 400;
    ctx.body = { success: false, message: '源文件不存在' };
    return;
  }

  try {
    // 读取文件内容
    const fileBuffer = fs.readFileSync(filePath);

    // 使用 XLSX 解析文件内容
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0]; // 获取第一个工作表的名称
    const sheet = workbook.Sheets[sheetName];

    // 将表格内容转换为 JSON，从第二行开始，提取第一列和第二列
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    // const result = data.slice(1).map(row => ({
    //   model: row[0].toUpperCase(), // 第一列
    //   price: row[1], // 第二列
    // }));
    // 过滤并验证数据
    const result = data.slice(1) // 跳过标题行
      .filter(row => {
        const model = row[0];
        const price = row[1];
        // 检查第一列长度是否不超过45，第二列是否是 float
        return typeof model === 'string' && model.length <= 45 && !isNaN(parseFloat(price));
      })
      .map(row => ({
        model: row[0].toUpperCase(), // 第一列转为大写
        price: parseFloat(row[1]), // 第二列转为 float
      }));
    await Dianlan.insertBasePriceBatch(result); 
    ctx.body = {
      success: true,
      message: '文件解析成功',
      // data: result,
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: '文件处理失败', error: error.message };
  }
  finally {
    // 删除临时文件
    try {
      fs.unlinkSync(filePath);
      console.log('临时文件已删除:', filePath);
    } catch (err) {
      console.error('删除文件失败:', err.message);
    }
  }
});
//locauser_detail_list
router.post('/public/api/locauser_detail_list', async (ctx, next) => {
  const { areaid } = ctx.request.body;
  console.log('locauser_detail_list', areaid)
  const res = await Dianlan.getlocaUser(areaid)

  ctx.body = {
    "code": 0,
    "data": res
  }
});
//loca_user_rela
router.post('/public/api/loca_user_rela', async (ctx, next) => {
  const { areaid } = ctx.request.body;
  console.log('loca_user_rela', areaid)
  const res = await Dianlan.searchRela(areaid)
  console.log('loca_user_rela', res)
  ctx.body = {
    "code": 0,
    "data": res
  }
});
//locauser_list
router.get('/public/api/locauser_list', async (ctx, next) => {
  console.log('locauser_list')
  const res = await Dianlan.getLocaUserList()
  console.log('locauser_list')
  ctx.body = {
    "code": 0,
    "data": res
  }
});
// get_all_user
router.get('/public/api/get_all_user', async (ctx, next) => {
  console.log('get_all_user')
  const res = await Dianlan.getAllUser()
  console.log('get_all_user')
  ctx.body = {
    "code": 0,
    "data": res
  }
});
// add_wp
router.post('/public/api/add_wp', async (ctx, next) => {
  const { ope, dianlan, user } = ctx.request.body;
  console.log('add_wp', dianlan, user, ope);

  const sqls = [];
  const params = [];
  const uid = uuidv4();

  try {
    // 获取有效的电缆ID
    const validDianlanIds = await Dianlan.getValidDianlanIds(dianlan);

    if (validDianlanIds.length === 0) {
      ctx.body = {
        code: 1,
        message: '没有符合条件的电缆记录',                                          
      };
      return;
    }

    // 插入 workpack 数据
    validDianlanIds.forEach((id) => {
      sqls.push(
        `insert into dev.workpack (wpid, wpowner, state, dianlanid, dianlanstate) values(?, ?, 0, ?, 0)`
      );
      params.push([uid, ope, id]);
    });

    // 更新 dianlan 表状态
    validDianlanIds.forEach((id) => {
      sqls.push(
        `update dev.projitem set state = 2 where dianlanid = ? and state = 1`
      );
      params.push([id]);
    });

    // 插入 wp_user 数据
    user.forEach((usercode) => {
      sqls.push(
        `insert into dev.wp_user (wp_id, user) values(?, ?)`
      );
      params.push([uid, usercode]);
    });

    // 执行事务
    await mysql_trans.transaction(sqls, params);

    ctx.body = {
      code: 0,
      message: '操作成功',
    };
  } catch (error) {
    console.error('事务执行失败:', error);

    ctx.body = {
      code: 1,
      message: '批量操作失败',
      error: error.message || error,
    };
  }
});

// router.post('/public/api/add_wp', async (ctx, next) => {
//   const { ope, dianlan, user } = ctx.request.body;
//   console.log('add_wp', dianlan, user, ope)
//   const sqls = [];
//   const params = [];
//   const uid = uuidv4()
//   dianlan.forEach((id) => {
//     sqls.push(
//       `insert into dev.workpack (wpid,wpowner,state,dianlanid,dianlanstate) values(?,?,0,?,0)`
//     );
//     params.push([uid, ope, id]);
//   });
//   dianlan.forEach((id) => {
//     sqls.push(
//       `update dev.dianlan set state = 1 where id =?`
//     );
//     params.push([id]);
//   });
//   user.forEach((usercode) => {
//     sqls.push(
//       `insert into dev.wp_user (wp_id,user) values(?,?)`
//     );
//     params.push([uid, usercode]);
//   });
//   try {
//     // 批量执行事务
//     const res = await mysql_trans.transaction(sqls, params);
//     console.log('add_wp', res);
//     ctx.body = {
//       code: 0,
//       data: res,
//     };
//   } catch (error) {
//     console.error('事务执行失败', error);

//     ctx.body = {
//       code: 1,
//       message: '批量操作失败',
//       error: error.message || error,
//     };
//   }
// });
//get AllSubWp
router.post('/public/api/getAllSubWp', async (ctx, next) => {
  const { id } = ctx.request.body;
  console.log('getAllSubWp', id)
  const res = await Dianlan.getAllSubWorkpacks(id)
  console.log('getAllSubWp', res)
  ctx.body = {
    "code": 0,
    "data": res
  }
});
//getAllSub
router.post('/public/api/getAllSub', async (ctx, next) => {
  const { id } = ctx.request.body;
  console.log('getAllSub', id)
  const res = await Dianlan.getAllSub(id)
  console.log('getAllSub', res)
  ctx.body = {
    "code": 0,
    "data": res
  }
});

// ana_laxian1
router.post('/public/api/ana_laxian1', async (ctx, next) => {
  const { id, locaitem } = ctx.request.body;
  console.log('ana_laxian1', id, locaitem)
  const res = await Dianlan.anaLaxian1()
  console.log('ana_laxian1', res);
  ctx.body = {
    "code": 0,
    "data": res
  }
});

//add_my_work
router.post('/public/api/add_my_work', async (ctx, next) => {
  const { code, id } = ctx.request.body;
  console.log('add_my_work', id, code);
  const result = await Dianlan.checkAndUpdateWorkpack(id, code);  // code 是当前用户的 id

  if (result.success) {
    ctx.body = { message: result.message };
    ctx.status = 200;  // 成功状态码
  } else {
    ctx.body = { message: result.message };
    ctx.status = 400;  // 错误状态码
  }
  }
)
///public/api/ana_laxian
router.post('/public/api/ana_laxian', async (ctx, next) => {
  const { id, locaitem } = ctx.request.body;
  console.log('ana_laxian', id, locaitem)
  const res = await Dianlan.anaLaxian()
  console.log('ana_laxian', res);
  ctx.body = {
    "code": 0,
    "data": res
  }
});

//del_my_work
router.post('/public/api/del_my_work', async (ctx, next) => {
  const { code, id } = ctx.request.body;
  console.log('del_my_work', code, id)
  const res = await Dianlan.delMyWork(id, code)
  
  console.log('del_my_work', res);

  if (res.success) {
    // 删除成功
    ctx.body = {
      code: 0,
      data: res.message
    };
  } else {
    // 删除失败
    ctx.body = {
      code: 1,
      message: res.message
    };
  }
});


// loca_user_add
router.post('/public/api/loca_user_add', async (ctx, next) => {
  const { areaid, usercode } = ctx.request.body;
  console.log('loca_user_add', areaid, usercode)
  const res = await Dianlan.addLocaUser(areaid, usercode)
  console.log('loca_user_add', res)
  ctx.body = {
    "code": 0,
    "data": res
  }
});
// add_work_pack
// 先判断下是否已经存在
router.post('/public/api/add_work_pack', async (ctx, next) => {
  console.log(uuidv4())
  ctx.body = {
    "code": 0,
    "data": 'res'
  }
});
// del_paip_wp
router.post('/public/api/del_paip_wp', async (ctx, next) => {
  const { id } = ctx.request.body;

  // 预检查条件
  const count = await Dianlan.checkWorkpackExist(id);

  // 如果没有符合条件的 workpack，则返回错误信息
  if (count === 0) {
    ctx.body = {
      code: 1,
      message: "没有符合条件的 workpack 被删除，操作中止",
    };
    return;
  }

  const sqls = [
    `UPDATE dev.projitem SET state = 1 WHERE dianlanid = (SELECT dianlanid FROM dev.workpack WHERE wpid = ?) and state = 2`,
    `DELETE FROM dev.workpack WHERE wpid = ? `,
    `DELETE FROM dev.wp_user WHERE wp_id = ?`,
    
  ];
  const params = [[id], [id], [id]];

  try {
    const results = await mysql_trans.transaction(sqls, params);

    ctx.body = {
      code: 0,
      data: results,
    };
  } catch (error) {
    ctx.body = {
      code: 1,
      message: "批量操作失败",
      error: error.message || error,
    };
  }
});



// public/api/get_paip_wp_list
router.post('/public/api/get_paip_wp_list', async (ctx, next) => {
  const { userCode,page } = ctx.request.body;
  console.log('get_paip_wp_list', userCode, page)
  const res = await Dianlan.getPaipWpList(userCode, page)
  // console.log('get_paip_wp_list', res)
  ctx.body = {
    "code": 0,
    "totalCount"  : res.totalCount,
    "data": res.data
  }
});
// /public/api/get_my_wp_list
router.post('/public/api/get_my_wp_list', async (ctx, next) => {
  const { userCode, qdate } = ctx.request.body;
  console.log('get_my_wp_list', userCode, qdate)
  const res = await Dianlan.getMyWpList(userCode, qdate)
  console.log('get_my_wp_list', res)
  ctx.body = {
    "code": 0,
    "data": res
  }
});


// loca_user_del
router.post('/public/api/loca_user_del', async (ctx, next) => {
  const { areaid, usercode } = ctx.request.body;
  console.log('loca_user_del', areaid, usercode)
  const res = await Dianlan.delLocaUser(areaid, usercode)
  console.log('loca_user_del', res)
  ctx.body = {  
    "code": 0,
    "data": res
  }
});
// cancel_laxian
router.post('/public/api/cancel_laxian', async (ctx, next) => {
  const { ope, locaitem, xian_id, proj } = ctx.request.body;
  console.log('cancel_laxian', ope, locaitem, xian_id, proj)
  var sqls = [];
  var params = [];
  sqls.push(`update dev.projitem set state = 0 where dianlanid = ? and state = 1`);
  params.push([xian_id]);
  // sqls.push(`update dev.dianlan set last_fangxian = null,last_fangxian_time=null,last_fangxian_loca=null where id = ?`);
  // params.push([xian_id]);
  try {
    // 批量执行事务
    const res = await mysql_trans.transaction(sqls, params);
    console.log('cancel_laxian', res);

    ctx.body = {
      code: 0,
      data: res,
    };
  } catch (error) {
    console.error('事务执行失败', error);

    ctx.body = {
      code: 1,
      message: '批量操作失败',
      error: error.message || error,
    };
  }
});

router.post('/public/api/laxian', async (ctx, next) => {
  const { xian_id, locaitem, ope, proj } = ctx.request.body;
  console.log('laxian', xian_id, locaitem, ope, proj);
  
  var sqls = [];
  var params = [];
  
  // 更新操作
  sqls.push(`
    UPDATE dev.dianlan 
    SET last_fangxian = ?, last_fangxian_time = NOW(), last_fangxian_loca = ? 
    WHERE id = ?
  `);
  params.push([ope, locaitem, xian_id]);
  
  // 插入操作
  sqls.push(`
    INSERT INTO dev.projitem (
      proj, proj_item, dianlanid, state, last_fangxian, last_fangxian_date, last_fangxian_loca
    ) 
    SELECT 
      b.projname AS proj,
      a.itemname AS proj_item,
      ? AS dianlanid,           
      '1' AS state,             
      ? AS last_fangxian,       
      CURRENT_TIMESTAMP AS last_fangxian_date,
      ? AS last_fangxian_loca   
    FROM 
      dev.proj_item a
    LEFT JOIN 
      dev.proj b 
    ON 
      a.projid = b.id
    WHERE 
      a.itemname = ?;
  `);
  params.push([xian_id, ope, locaitem, proj]);
  
  try {
    // 批量执行事务
    const res = await mysql_trans.transaction(sqls, params);
    console.log('batch_laxian', res);

    ctx.body = {
      code: 0,
      data: res,
    };
  } catch (error) {
    console.error('事务执行失败', error);

    ctx.body = {
      code: 1,
      message: '批量操作失败',
      error: error.message || error,
    };
  }
});


// batch_laxian
router.post('/public/api/batch_laxian', async (ctx, next) => {
  const { xian_ids, locaitem, ope, proj } = ctx.request.body;
  console.log('batch_laxian', xian_ids, locaitem, ope, proj);

  if (!Array.isArray(xian_ids) || xian_ids.length === 0) {
    ctx.body = {
      code: 1,
      message: 'xian_ids 应该是一个非空数组',
    };
    return;
  }

  // 构造 SQL 语句和参数
  const sqls = [];
  const params = [];

  try {
    // 对每个xian_id进行操作
    for (const id of xian_ids) {
      sqls.push(
              `UPDATE dev.dianlan SET last_fangxian = ?, last_fangxian_time = NOW(), last_fangxian_loca = ? WHERE id = ?`
            );
            params.push([ope, locaitem, id]);
      // 查询proj和proj_item
      const projItemResult = await Dianlan.getProjItem(proj);

      if (!projItemResult) {
        console.error(`无法找到对应的proj和proj_item: ${proj}`);
        continue;
      }

      const { proj: projName, proj_item: projItemName } = projItemResult;

      // 检查是否存在projitem
      const exists = await Dianlan.checkExistence(id, projName, projItemName);

      if (exists) {
        // 如果存在，执行UPDATE
        sqls.push(`
          UPDATE dev.projitem
          SET last_fangxian = ?, last_fangxian_date = CURRENT_TIMESTAMP, last_fangxian_loca = ?
          WHERE dianlanid = ? AND proj = ? AND proj_item = ? AND state = 1;
        `);
        params.push([ope, locaitem, id, projName, projItemName]);
      } else {
        // 如果不存在，执行INSERT
        sqls.push(`
          INSERT INTO dev.projitem (
            proj, proj_item, dianlanid, state, last_fangxian, last_fangxian_date, last_fangxian_loca
          ) 
          SELECT 
            b.projname AS proj,
            a.itemname AS proj_item,
            ? AS dianlanid,           
            '1' AS state,             
            ? AS last_fangxian,       
            CURRENT_TIMESTAMP AS last_fangxian_date,
            ? AS last_fangxian_loca   
          FROM 
            dev.proj_item a
          LEFT JOIN 
            dev.proj b ON a.projid = b.id
          WHERE 
            a.itemname = ?;
        `);
        params.push([id, ope, locaitem, proj]);
      }
    }

    // 执行事务
    const res = await mysql_trans.transaction(sqls, params);
    console.log('batch_laxian', res);

    ctx.body = {
      code: 0,
      data: res,
    };
  } catch (error) {
    console.error('事务执行失败', error);

    ctx.body = {
      code: 1,
      message: '批量操作失败',
      error: error.message || error,
    };
  }



  
});

// router.post('/public/api/batch_laxian', async (ctx, next) => {
//   const { xian_ids, locaitem, ope, proj } = ctx.request.body; 
//   console.log('batch_laxian', xian_ids, locaitem, ope);

//   if (!Array.isArray(xian_ids) || xian_ids.length === 0) {
//     ctx.body = {
//       code: 1,
//       message: 'xian_ids 应该是一个非空数组',
//     };
//     return;
//   }

//   // 构造 SQL 语句和参数
//   const sqls = [];
//   const params = [];

//   xian_ids.forEach((id) => {
//     sqls.push(
//       `UPDATE dev.dianlan SET last_fangxian = ?, last_fangxian_time = NOW(), last_fangxian_loca = ? WHERE id = ?`
//     );
//     params.push([ope, locaitem, id]);
//     sqls.push(
//       `update dev.projitem set state = 0 where dianlanid =? and state = 1`
//     );
//     params.push([id]);
//     sqls.push(`
//       INSERT INTO dev.projitem (
//         proj, proj_item, dianlanid, state, last_fangxian, last_fangxian_date, last_fangxian_loca
//       ) 
//       SELECT 
//         b.projname AS proj,
//         a.itemname AS proj_item,
//         ? AS dianlanid,           
//         '1' AS state,             
//         ? AS last_fangxian,       
//         CURRENT_TIMESTAMP AS last_fangxian_date,
//         ? AS last_fangxian_loca   
//       FROM 
//         dev.proj_item a
//       LEFT JOIN 
//         dev.proj b 
//       ON 
//         a.projid = b.id
//       WHERE 
//         a.itemname = ?;
//     `);
//     params.push([id, ope, locaitem, proj]);
//   });

//   try {
//     // 批量执行事务
//     const res = await mysql_trans.transaction(sqls, params);
//     console.log('batch_laxian', res);

//     ctx.body = {
//       code: 0,
//       data: res,
//     };
//   } catch (error) {
//     console.error('事务执行失败', error);

//     ctx.body = {
//       code: 1,
//       message: '批量操作失败',
//       error: error.message || error,
//     };
//   }
// });
// proj_detail_mod
router.post('/public/api/proj_detail_mod', async (ctx, next) => {
  const { itemid, itemname } = ctx.request.body;
  console.log('proj_detail_mod', itemid, itemname)
  const res = await Dianlan.projItemMod(itemid, itemname)
  console.log('proj_detail_mod',  res)
  ctx.body = {
    "code": 0,
    "data": res
  }
});
//area_detail_mod
router.post('/public/api/area_detail_mod', async (ctx, next) => {
  const { itemid, itemname } = ctx.request.body;
  console.log('area_detail_mod', itemid, itemname)
  const res = await Dianlan.areaItemMod(itemid, itemname)
  console.log('area_detail_mod',  res)
  ctx.body = {
    "code": 0,
    "data": res
  }
});
//proj_detail_del
router.post('/public/api/proj_detail_del', async (ctx, next) => {
  const { itemid } = ctx.request.body;
  console.log('proj_detail_del',  itemid)
  const res = await Dianlan.projItemDel(itemid)
  ctx.body = {
    "code": 0,
    "data": res
  }
});

//area_detail_del
router.post('/public/api/area_detail_del', async (ctx, next) => {
  const { itemid } = ctx.request.body;
  console.log('area_detail_del',  itemid)
  const res = await Dianlan.areaItemDel(itemid)
  ctx.body = {
    "code": 0,
    "data": res
  }
});
//proj_mod
router.post('/public/api/proj_mod', async (ctx, next) => {
  const { locaname, projid } = ctx.request.body;
  console.log('proj_mod', locaname, projid)
  const res = await Dianlan.projMod(locaname, projid)
  console.log('proj_mod',  res)
  ctx.body = {
    "code": 0,
    "data": res
  }
});
//area_mod
router.post('/public/api/area_mod', async (ctx, next) => {
  const { locaname, areaid } = ctx.request.body;
  console.log('area_mod', locaname, areaid)
  const res = await Dianlan.areaMod(locaname, areaid)
  console.log('area_mod',  res)
  ctx.body = {  
    "code": 0,
    "data": res
  }
});

router.post('/public/api/search_loca', async (ctx, next) => {
  const { ope } = ctx.request.body;
  console.log('search_loca', ope)
  const res = await Dianlan.searchLoca( ope)
  
  ctx.body = {
    "code": 0,
    "data": res
  }
});

router.post('/public/api/gaga_post', async (ctx, next) => {
  const { gaga } = ctx.request.body;
  const res = await Dianlan.getUser(gaga)
  console.log('getUser', gaga, res)
  ctx.body = {
    "code": 0,
    "data": res
  }
});

router.post('/public/api/get_user_list', async (ctx, next) => {
  
  const { sw,page } = ctx.request.body;
  console.log('getUserList',sw,page)
  const res = await Dianlan.getUserList(sw,page)
  var haha = []
  console.log('getUserListhhhhh',  res)
  if(sw){
    for (var i in res.data) {
      var m = util1.match(res.data[i]['username']+res.data[i]['usercode']+res.data[i]['rolename'], sw);
      if (m) {
        haha.push(res.data[i])
       }
      
    }
  }
  
  ctx.body = {
    "code": 0,
    "data": sw?haha:res.data,
    "totalCount": sw?haha.length:res.totalCount
  }
});

router.post('/public/api/search_user_code', async (ctx, next) => {
  const { code } = ctx.request.body;
  console.log('search_user_code',code)
  const res = await Dianlan.searchCode(code)
  console.log('search_user_code',  res)
  ctx.body = {
    "code": 0,
    "data": res
  }
});
// proj_add
router.post('/public/api/proj_add', async (ctx, next) => {
  const { locaname } = ctx.request.body;
  console.log('area_add', locaname);
  try {
    // 调用 addArea 方法
    const res = await Dianlan.addProj(locaname);
    console.log('area_add', res);
    // 返回成功响应
    ctx.body = {
      "code": 0,
      "data": res
    };
  } catch (error) {
    // 检查是否是重复条目的错误
    if (error.code === 'ER_DUP_ENTRY') {
      ctx.status = 400; // 设置为400 Bad Request
      ctx.body = {
        code: 1,
        message: `插入失败，'${locaname}' 已经存在。`
      };
    } else {
      // 其他错误
      ctx.status = 500; // 设置为500 Internal Server Error
      ctx.body = {
        code: 500,
        message: '服务器内部错误，请稍后再试。'
      };
    }
  }
});
//area_add
router.post('/public/api/area_add', async (ctx, next) => {
  const { locaname } = ctx.request.body;
  console.log('area_add', locaname);

  try {
    // 调用 addArea 方法
    const res = await Dianlan.addArea(locaname);
    console.log('area_add', res);

    // 返回成功响应
    ctx.body = {
      "code": 0,
      "data": res
    };
  } catch (error) {
    // 检查是否是重复条目的错误
    if (error.code === 'ER_DUP_ENTRY') {
      ctx.status = 400; // 设置为400 Bad Request
      ctx.body = {
        code: 1,
        message: `插入失败，'${locaname}' 已经存在。`
      };
    } else {
      // 其他错误
      ctx.status = 500; // 设置为500 Internal Server Error
      ctx.body = {
        code: 500,
        message: '服务器内部错误，请稍后再试。'
      };
    }
  }
});
// proj_detail_add
router.post('/public/api/proj_detail_add', async (ctx, next) => {
  const { projid, itemname } = ctx.request.body;
  console.log('proj_detail_add', itemname);
  try {
    // 调用 addProjItem 方法
    const res = await Dianlan.addProjItem(projid, itemname);
    console.log('proj_detail_add', res);
    // 返回成功响应
    ctx.body = {
      code: 0,
      data: res,
    };
  } catch (error) {
    // 检查是否是重复条目错误
    if (error.code === 'ER_DUP_ENTRY') {
      ctx.status = 400; // 设置为 400 Bad Request
      ctx.body = {
        code: 1,
        message: `插入失败，项目 '${itemname}' 已经存在于项目 ID '${projid}'。`,
      };
    } else {
      // 处理其他错误
      console.error('proj_detail_add 错误:', error); // 打印错误日志以便调试
      ctx.status = 500; // 设置为 500 Internal Server Error
      ctx.body = {
        code: 500,
        message: '服务器内部错误，请稍后再试。',
      };
    }
  }
});
// area_detail_add
router.post('/public/api/area_detail_add', async (ctx, next) => {
  const { areaid, itemname } = ctx.request.body;
  console.log('area_detail_add', itemname);

  try {
    // 调用 addAreaItem 方法
    const res = await Dianlan.addAreaItem(areaid, itemname);
    console.log('area_detail_add', res);

    // 返回成功响应
    ctx.body = {
      code: 0,
      data: res,
    };
  } catch (error) {
    // 检查是否是重复条目错误
    if (error.code === 'ER_DUP_ENTRY') {
      ctx.status = 400; // 设置为 400 Bad Request
      ctx.body = {
        code: 1,
        message: `插入失败，项目 '${itemname}' 已经存在于区域 ID '${areaid}'。`,
      };
    } else {
      // 处理其他错误
      console.error('area_detail_add 错误:', error); // 打印错误日志以便调试
      ctx.status = 500; // 设置为 500 Internal Server Error
      ctx.body = {
        code: 500,
        message: '服务器内部错误，请稍后再试。',
      };
    }
  }
});
// ep_price_del
router.post('/public/api/ep_price_del', async (ctx, next) => {
  const { id } = ctx.request.body;
  console.log('ep_price_del',id)
  const res = await Dianlan.epPriceDel(id)
  console.log('ep_price_del',  res)
  ctx.body = {
    "code": 0,
    "data": res
  }
});
//dianlan_baseprice_del
router.post('/public/api/dianlan_baseprice_del', async (ctx, next) => {
  const { id } = ctx.request.body;
  console.log('dianlan_baseprice_del',id)
  const res = await Dianlan.basepriceDel(id)
  console.log('dianlan_baseprice_del',  res)
  ctx.body = {
    "code": 0,
    "data": res
  }
});
// public/api/ep_price_mod
router.post('/public/api/ep_price_mod', async (ctx, next) => {
  const { id, model, price } = ctx.request.body;
  console.log('ep_price_mod',id, model, price)
  const res = await Dianlan.epPriceMod(id, model, price)
  console.log('ep_price_mod',  res)
  ctx.body = {
    "code": 0,
    "data": res
  }
});
// public/api/dianlan_baseprice_mod
router.post('/public/api/dianlan_baseprice_mod', async (ctx, next) => {
  const { id, model, price } = ctx.request.body;
  console.log('dianlan_baseprice_mod',id, model, price)
  const res = await Dianlan.basepriceMod(id, model, price)
  console.log('dianlan_baseprice_mod',  res)
  ctx.body = {
    "code": 0,
    "data": res
  }
});
// proj_detail_list
router.post('/public/api/proj_detail_list', async (ctx, next) => {
  const { projid } = ctx.request.body;
  console.log('proj_detail_list',projid)
  const res = await Dianlan.projItem(projid)
  console.log('proj_detail_list',  res)
  ctx.body = {
    "code": 0,
    "data": res
  }
});

//area_detail_list
router.post('/public/api/area_detail_list', async (ctx, next) => {
  const { areaid } = ctx.request.body;
  console.log('area_detail_list',areaid)
  const res = await Dianlan.areaItem(areaid)
  console.log('area_detail_list',  res)
  ctx.body = {
    "code": 0,
    "data": res
  }
});
// proj_del
router.post('/public/api/proj_del', async (ctx, next) => {
  const { projid } = ctx.request.body;
  console.log('proj_del',projid)
  const res = await Dianlan.projDel(projid)
  console.log('proj_del',  res)
  ctx.body = {
    "code": 0,
    "data": res
  }
})
//dianlan_del
router.post('/public/api/dianlan_del', async (ctx, next) => {
  const { daihao,model,specification,op_type } = ctx.request.body;
  console.log('dianlan_del',daihao,model,specification,op_type)
  const res = await Dianlan.dianlanDel(daihao,model,specification,op_type)
  console.log('dianlan_del',  res)
  ctx.body = {
    "code": 0,
    "data": res
  }
})
// area_del
router.post('/public/api/area_del', async (ctx, next) => {
  const { areaid } = ctx.request.body;
  console.log('area_del',areaid)
  const res = await Dianlan.areaDel(areaid)
  console.log('area_del',  res)
  ctx.body = {
    "code": 0,
    "data": res
  }
})
//dianlan_list
router.post('/public/api/dianlan_list', async (ctx, next) => {
  const { sw,page,proj } = ctx.request.body;
  console.log('dianlan_list',sw,page,proj)
  const res = await Dianlan.dianlanList(sw,page,proj)
  var haha = []
  
  if(sw){
    for (var i in res.data) {
      var m = util1.match(res.data[i]['model']+res.data[i]['specification']+res.data[i]['facilities_name']+res.data[i]['facilities_loca']+res.data[i]['sysname'], sw);
      if (m) {
        haha.push(res.data[i])
       }

    }
  }
  console.log('dianlan_list',  haha)
  ctx.body = {
    "code": 0,
    "data": sw?haha:res.data,
    "totalCount": sw?haha.length:res.totalCount
  }
});
//search_proj_list 
router.post('/public/api/search_proj_list', async (ctx, next) => {
  const { sw } = ctx.request.body;
  console.log('search_proj_list',sw)
  const res = await Dianlan.projList()
  var haha = []
  for (var i in res) {
    var m = util1.match(res[i]['projname'], sw);
    if (m) {
      haha.push({
          'id': res[i]['id'],
          'projname': res[i]['projname']
        })
     }
    
}
  console.log('search_proj_list',  res)
  ctx.body = {
    "code": 0,
    "data": haha
  }
});

// proj_list
router.get('/public/api/proj_list', async (ctx, next) => {
  const res = await Dianlan.projList()
  console.log('proj_list',  res)
  ctx.body = {
    "code": 0,
    "data": res
  }
});

router.get('/public/api/area_list', async (ctx, next) => {
  const res = await Dianlan.areaList()
  console.log('area_list',  res)
  ctx.body = {
    "code": 0,
    "data": res
  }
});

router.post('/public/api/add_user', async (ctx, next) => {
  const { username,usercode,role,shangji,quyu } = ctx.request.body;
  console.log('add_user',username,usercode,role,shangji,quyu)
  const res = await Dianlan.addUser(username,usercode,role,shangji,quyu)
  console.log('add_user',res)
  ctx.body = {
    "code": 0,
    "data": res
  }
});
// ep_price_submit
router.post('/public/api/ep_price_submit', async (ctx, next) => {
  const { model, price } = ctx.request.body;
  console.log('ep_price_submit', model, price);
  try {
    const res = await Dianlan.epPriceSubmit(model.toUpperCase(), price);
    console.log('ep_price_submit', res);
    ctx.body = {
      code: 0,
      data: res,
    };
  } catch (error) {
    console.error('插入 ep_price 出错:', error);
    // 将错误信息返回给前端
    ctx.status = 400; // 可根据需要调整状态码
    ctx.body = {
      code: 1,
      message: '插入数据失败',
      error: error.message,
    };
  }
});

//dianlan_baseprice_submit
router.post('/public/api/dianlan_baseprice_submit', async (ctx, next) => {
  const { model, price } = ctx.request.body;
  console.log('dianlan_baseprice_submit', model, price);
  
  try {
    const res = await Dianlan.dianlanBasepriceSubmit(model.toUpperCase(), price);
    console.log('dianlan_baseprice_submit', res);
    ctx.body = {
      code: 0,
      data: res,
    };
  } catch (error) {
    console.error('插入 dianlan_baseprice 出错:', error);

    // 将错误信息返回给前端
    ctx.status = 400; // 可根据需要调整状态码
    ctx.body = {
      code: 1,
      message: '插入数据失败',
      error: error.message,
    };
  }
});

router.post('/public/api/mod_user', async (ctx, next) => {
  const { sw,type,user } = ctx.request.body;
  console.log('mod_user',sw,type,user)
  const res = await Dianlan.modUser(sw,type,user)
  console.log('mod_user',res)
  ctx.body = {
    "code": 0,
    "data": res
  }
});

router.post('/public/api/get_leader_list', async (ctx, next) => {
  const { sw,type } = ctx.request.body; 
  console.log('getLeaderList',sw,type)
  const res = await Dianlan.getLeaderList(type)
  var haha = []
  for (var i in res) {
    var m = util1.match(res[i]['username']+res[i]['usercode'], sw);
    if (m) {
      haha.push({
          'username': res[i]['username'],
          'usercode': res[i]['usercode']
        })
     }
    
}
  console.log('getLeaderList',  res)
  ctx.body = {
    "code": 0,
    "data": haha
  }
});
// public/api/download-template-1

router.get('/public/api/download-template-1', async (ctx) => {
  try {
   
    const filePath = path.join(__dirname, '/public','/电缆价目表.xlsx'); // 替换为你的Excel文件路径
    const fileStream = fs.createReadStream(filePath);
    // 设置文件名
    const fileName = '电缆价目表.xlsx';
    const encodedFileName = encodeURIComponent(fileName);

    // 设置响应头
    //ctx.set('Content-Type', 'application/vnd.ms-excel'); // Excel 文件的 MIME 类型
    ctx.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    ctx.set('Content-Disposition', `attachment; filename*=UTF-8''${encodedFileName}`);

    // 将生成的 Excel 文件 Buffer 作为响应体发送
    ctx.body = fileStream;
  } catch (error) {
    console.error('下载模板出错:', error);
    ctx.status = 500;
    ctx.body = { message: '服务器错误，下载失败' };
  }
});

//ep_price
router.post('/public/api/ep_price', async (ctx, next) => {
  const { sw,page } = ctx.request.body;
  const flag = (sw && sw.trim()!== "")
  console.log('ep_price',sw,page)
  const res = await Dianlan.epPrice(sw,page)
  console.log('ep_price',res)
  var haha = []
  if (flag) {
    for (var i in res.data) {
      var m = util1.match(res.data[i]['ep']+res.data[i]['price'], sw);
      if (m) {
        haha.push(res.data[i])
       }
    }
  }
  ctx.body = {
    "code": 0,
    "data": flag?haha:res.data,
    "totalCount": flag?haha.length:res.totalCount
  }
});
//dianlan_baseprice
router.post('/public/api/dianlan_baseprice', async (ctx, next) => {
  const { sw,page } = ctx.request.body;
  const flag = (sw && sw.trim() !== "")
  console.log('dianlan_baseprice',sw,page)
  const res = await Dianlan.dianlanBaseprice(sw,page)
  console.log('dianlan_baseprice',res)
  var haha = []
  if (flag) {
    for (var i in res.data) {
      var m = util1.match(res.data[i]['model']+res.data[i]['price'], sw);
      if (m) {
        haha.push(res.data[i])
       }
    }
  }
  ctx.body = {
    "code": 0,
    "data": flag?haha:res.data,
    "totalCount": flag?haha.length:res.totalCount
  }
});
// 搜索参数
router.post('/public/api/search_company', async (ctx, next) => {
  const { sw,company,proj,daihao,model,spec,facilities_name,facilities_loca,total_length,sysname } = ctx.request.body;
  console.log('search_company',sw,company,proj,daihao,model,spec,facilities_name,facilities_loca,total_length,sysname)
  const res = await Dianlan.searchCompany(sw,company,proj,daihao,model,spec,facilities_name,facilities_loca,total_length,sysname)
  console.log('searchCompany', res)
  ctx.body = {
    "code": 0,
    "data": res
  }
});
//搜索具体电缆
router.post('/public/api/search_dl', async (ctx, next) => {
  const { company,proj,daihao,model,spec,facilities,facilities_loca,total_length,sysname,page } = ctx.request.body;
  console.log('search_dl',company,proj,daihao,model,spec,facilities,facilities_loca,total_length,sysname,page)
  const res = await Dianlan.searchDl(company,proj,daihao,model,spec,facilities,facilities_loca,total_length,sysname,page)
  console.log('searchDl',res.totalCount)
  ctx.body = {
    "code": 0,
    "totalCount"  : res.totalCount,
    "data": res.data
  }
});

router.post('/api/search-user-list', async (ctx, next) => {
  const { sw } = ctx.request.body;
  var cnt_tp = 1
  const res =  await Restuser.searchUser();
  var haha = []

  for (var i in res) {
      if (cnt_tp < 10) {
        var m = util1.match(res[i]['number']+res[i]['name'], sw);
        if (m) {
            haha.push({
              'number': res[i]['number'],
              'name': res[i]['name']
            })
            cnt_tp++
        }
      } else {
        break;
      }
  }
  
  //console.log('search-user', haha)
  ctx.body = {
      "code": 0,
      "data": {"list": haha}
  }
});

router.get('/api/get-org-list', async (context, next) => {

  
  let orglist = await User.getOrgList_v2()

  
  context.body = {
    "code":0,
    "data": orglist
  }
})




router.get('/api/get-list', async (ctx, next) => {
    const res = await Restuser.getCataList()
    
    ctx.body = {
      "code": 0,
      "data": {"list": res}
    }
  });

router.get('/api/get-list-tree', async (ctx, next) => {
    const res = await Restuser.getCataListTree()
    
    ctx.body = {
      "code": 0,
      "data": {"list": res}
    }
  });