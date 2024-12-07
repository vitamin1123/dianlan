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

const User = require('./controller/Dianlan') ;



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

router.post('/public/api/gaga_post', async (ctx, next) => {
  const { gaga } = ctx.request.body;
  ctx.body = {
    "code": 0,
    "data": gaga
  }
});




router.post('/api/del_share_id', async (ctx, next) => {
  const { id } = ctx.request.body;
  const { ope } = ctx.request.body;
  var haha = await Restuser.delShareById(id,ope);
  console.log('del_share_id', haha)
  ctx.body = {
      "code": 0,
      "data": haha
  }
});

router.post('/api/get-share-list', async (ctx, next) => {
  const { id, type } = ctx.request.body;
  var dept = await User.getUserDept(id);
  console.log('rank——shares1：', id, type,dept[0].deptcode)
  var haha = await Restuser.getRankShares(id,type,dept[0].deptcode);
  console.log('rank——shares2：', id, type,dept[0].deptcode,haha)
  ctx.body = {
      "code": 0,
      "data": {"list": haha}
  }
});

router.post('/api/search-user-list', async (ctx, next) => {
  const { sw } = ctx.request.body;
  var cnt_tp = 1
  const res =  await Restuser.searchUser();
  var haha = []
  // for (var cnt in res) {
  //   be_vis[res[cnt]['number']] = res[cnt]['number'], res[cnt]['emp_name'] + '_' + res[cnt]['org_name'] + '_' + res[cnt]['phone']
  // }
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
  //var query_num = context.request.body.emp_code
  //console.log('query_num',query_num)
  
  let orglist = await User.getOrgList_v2()
  //console.log('www',orglist.list[0].org_num)
  
  //console.log('orglist',orglist)
  
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