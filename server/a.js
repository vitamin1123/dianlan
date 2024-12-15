const Koa = require('koa');
const app = new Koa();
const Router = require('koa-router');
// const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
// const fontkit = require('@pdf-lib/fontkit'); // 加载字体支持
const fs = require('fs');
const path = require('path');
const koaStatic = require('koa-static');
// const historyFallback = require('connect-history-api-fallback');
// const koaConnect = require('koa-connect'); // 使用 koa-connect 来包装 connect-history-api-fallback
const { koaBody } = require('koa-body');
const jwt = require('koa-jwt');
const jwt1 = require('jsonwebtoken');
const bodyParser = require('koa-bodyparser');
const base64 = require('base-64')
const crypto = require('crypto');
const mysql_trans = require("./db/mysql_trans_110.js");
const axios = require('axios');
const util1 = require('./util/pinyin');
const router = new Router();

const Dianlan = require('./controller/Dianlan') ;



const doc_path = '/home/dev/mp/docs/'
const JWT_SECRET = 'e2657e6a-7038-45db-91d4-01dbaa47c9aa'

// 使用 connect-history-api-fallback，通过 koa-connect 来包装
// app.use(koaConnect(historyFallback()));

// 提供静态文件服务
// app.use(koaStatic('/home/dev/mp/zsk/dist')); // 假设你的静态文件在该目录下

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

router.post('/public/api/laxian', async (ctx, next) => {
  const { xian_id,proj,ope } = ctx.request.body;
  console.log('laxian', xian_id, proj, ope)
  const res = await Dianlan.addLaxian(xian_id, proj, ope)
  
  ctx.body = {
    "code": 0,
    "data": res
  }
});

router.post('/public/api/search_loca', async (ctx, next) => {
  const { ope } = ctx.request.body;
  console.log('search_loca', proj, ope)
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
      var m = util1.match(res.data[i]['username']+res.data[i]['usercode'], sw);
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
  const { sw,company,proj,daihao,model,spec,facilities_name } = ctx.request.body;
  console.log('search_company',sw,company,proj,daihao,model,spec,facilities_name)
  const res = await Dianlan.searchCompany(sw,company,proj,daihao,model,spec,facilities_name)
  console.log('searchCompany', res)
  ctx.body = {
    "code": 0,
    "data": res
  }
});
//搜索具体电缆
router.post('/public/api/search_dl', async (ctx, next) => {
  const { company,proj,daihao,model,spec,facilities,page } = ctx.request.body;
  console.log('search_dl',company,proj,daihao,model,spec,facilities,page)
  const res = await Dianlan.searchDl(company,proj,daihao,model,spec,facilities,page)
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