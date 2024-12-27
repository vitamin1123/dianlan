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
const base64 = require('base-64')
const crypto = require('crypto');
const mysql_trans = require("./db/mysql_trans_110.js");
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const util1 = require('./util/pinyin');
const router = new Router();

const Dianlan = require('./controller/Dianlan') ;



const doc_path = '/home/dev/mp/docs/'
const JWT_SECRET = 'e2657e6a-7038-45db-91d4-01dbaa47c9aa'

// 使用 connect-history-api-fallback，通过 koa-connect 来包装
app.use(koaConnect(historyFallback()));

// 提供静态文件服务
app.use(koaStatic('C:/Users/xyy/Desktop/dianlan/dist')); // 假设你的静态文件在该目录下

app.use(koaBody({  
  multipart: true,  
  formidable: {  
    uploadDir: doc_path, // 设置文件上传目录  
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
        `update dev.dianlan set state = 1 where id = ?`
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

router.post('/public/api/laxian', async (ctx, next) => {
  const { xian_id,locaitem,ope } = ctx.request.body;
  console.log('laxian', xian_id, locaitem, ope)
  const res = await Dianlan.addLaxian(xian_id, locaitem, ope)
  
  ctx.body = {
    "code": 0,
    "data": res
  }
});
// batch_laxian
router.post('/public/api/batch_laxian', async (ctx, next) => {
  const { xian_ids, locaitem, ope } = ctx.request.body; 
  console.log('batch_laxian', xian_ids, locaitem, ope);

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

  xian_ids.forEach((id) => {
    sqls.push(
      `UPDATE dev.dianlan SET last_fangxian = ?, last_fangxian_time = NOW(), last_fangxian_loca = ? WHERE id = ? and last_fangxian is null`
    );
    params.push([ope, locaitem, id]);
  });

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