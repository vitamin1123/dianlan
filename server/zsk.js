const Koa = require('koa');
const app = new Koa();
const Router = require('koa-router');
// const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
// const fontkit = require('@pdf-lib/fontkit'); // 加载字体支持
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
const util1 = require('./util/pinyin');
const router = new Router();

const User = require('./controller/User') ;
const Restuser = require('./controller/Restuser'); 
const elastic_xy = require('./test_es');

const doc_path = '/home/dev/mp/docs/'
const JWT_SECRET = '64beb0a3-66b3-69df-eaad-f1abc5fcc316'

// 使用 connect-history-api-fallback，通过 koa-connect 来包装
app.use(koaConnect(historyFallback()));

// 提供静态文件服务
app.use(koaStatic('/home/dev/mp/zsk/dist')); // 假设你的静态文件在该目录下

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

const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

router.post('/api/user/login', async (ctx, next) => {
  
  const { name, password } = ctx.request.body;
  try {  
    const secret = '64beb0a3-66b3-69df-eaad-f1abc5fcc316';
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
    const secret = '64beb0a3-66b3-69df-eaad-f1abc5fcc316';
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

router.post('/api/addShare', async (ctx, next) => {
  const { productName, sdept, suser, stime, ope} = ctx.request.body
  console.log(' 文档：',productName, ' s部门：',sdept, ' s用户：',suser, ' s时间：',stime, ' 操作人：',ope)
  if (!['1','2','3','4'].includes(stime)){
    ctx.body = {
      code: 0,
      data: {
        code: 'err',
        message: '必须设置分享时长'
      }
    }
    return
  }
  const tp_dic = {
    1:-1,
    2:-7,
    3:-30,
    4: null
  }
  const intervalDays = tp_dic[stime]; 
  console.log('intervalDays: ',intervalDays)
  if (sdept.length == 0 && isEmpty(suser)){
    ctx.body = {
      code: 0,
      data: {
        code: 'err',
        message: '必须分享给某个人或某个部门'
      }
    }
    return
  }
  const sql_tp = []
  const params = []
  if (sdept.length > 0) {
    if (intervalDays === null ){
      sql_tp.push(`insert into dev.shares (type,share,endtime,ope,ope_time,doc) values (?,?,?,?,NOW(),?)`)
    }else {
      sql_tp.push(`insert into dev.shares (type,share,endtime,ope,ope_time,doc) values (?,?,DATE_SUB(now(), INTERVAL ? DAY),?,NOW(),?)`)
    }
    
    params.push([1,sdept[0],intervalDays,ope,productName])
  }
  if (!isEmpty(suser)) {
    if (intervalDays === null ){
      sql_tp.push(`insert into dev.shares (type,share,endtime,ope,ope_time,doc) values (?,?,?,?,NOW(),?)`)
    }else {
      sql_tp.push(`insert into dev.shares (type,share,endtime,ope,ope_time,doc) values (?,?,DATE_SUB(now(), INTERVAL ? DAY),?,NOW(),?)`)
    }
    
    params.push([2,suser,intervalDays,ope,productName])
  }
  console.log('语句： ',sql_tp,params)
  //const del_sql_res = await Restuser.delDeptDoc(id)
  const res_1 = await  mysql_trans.transaction(sql_tp, params);
  console.log(res_1)
  if (res_1 instanceof Error) {
    // 事务执行失败
    ctx.body =  {
      code: 0, // 错误码，例如500表示服务器错误
      data: {
        code: 'err',
        message: '分享失败'
      }
    };
  } else {
    // 事务执行成功
    ctx.body={
      code: 0, // 成功码，例如200表示成功
      data: {
        code: 'success',
        message: '分享成功！'
      }
    };
  }
});


router.post('/api/get-userinfo', async (ctx, next) => {
  const postData = ctx.request.body.id
  console.log('日子： ',ctx.request.body.id)
  const res = await User.getUserInfo(postData)
  console.log('res:',res)
  ctx.body = {
    code: 0,
    
    "data": {
      "message": res.length>0?res[0]['days'] : 0,
      "success": true,
    }
  }
});

router.post('/api/get-recent-up', async (ctx, next) => {
  const { id } = ctx.request.body;
  var haha = await Restuser.getRecentUp(id);
  console.log('recent_up', haha)
  ctx.body = {
      "code": 0,
      "data": {"list": haha}
  }
});

router.post('/api/get-upNum', async (ctx, next) => {
  const { id } = ctx.request.body;
  var haha = await Restuser.getUpNum(id);
  
  const items = ['https://avatars.githubusercontent.com/Wen1kang','https://avatars.githubusercontent.com/pengYYYYY','https://avatars.githubusercontent.com/u/24469546?s=96&v=4','https://avatars.githubusercontent.com/u/88708072?s=96&v=4']
  //console.log('ava: ',items[Math.floor(Math.random()*items.length)])
  for(var i = 0 ;i<haha.length;i++) {
    //console.log(haha[i])
    haha[i]['avatar'] = items[Math.floor(Math.random()*items.length)]
    //console.log(haha[i]['avatar'])
  }
  console.log('get-upNum', haha)
  ctx.body = {
      "code": 0,
      "data": {"list": haha}
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

function sanitizeFilename(filename) {  

  const parts = filename.split('.');  
    let baseName = parts.slice(0, -1).join('.'); // 文件名（不含扩展名）  
    let extension = parts.pop(); // 扩展名  
  
    // 检查并清理扩展名（如果需要）  
    // 这里我们假设只保留已知的安全扩展名，或者简单地保留原扩展名（如果它不是恶意的）  
    const maliciousExtensions = new Set([  
        'php', 'asp', 'aspx', 'exe', 'scr', 'pif', 'bat', 'cmd',  
        // ... 添加其他你认为是恶意的扩展名，注意这里不包含点号  
    ]);  
  
    if (maliciousExtensions.has(extension.toLowerCase())) {  
        // 如果扩展名是恶意的，则替换为默认的安全扩展名（例如.txt）  
        extension = 'txt';  
    }  
  
    // 清理文件名部分  
    // 移除或替换特殊字符和路径遍历字符  
    const specialCharsAndTraversalRegex = /[\\\/%"\s\.\.]+/g;  
    baseName = baseName.replace(specialCharsAndTraversalRegex, '_');  
  

  
    
    return `${baseName}.${extension}`;  
}


router.post('/api/get_card_info',async (ctx, next) => {
  const { name } = ctx.request.body;
  const { isShare } = ctx.request.body;
  
  console.log('我的card-info：',name, isShare)
  if (!name) {
    ctx.status = 400;
    ctx.body = { success: false, message: 'name 参数缺失' };
    return;
  }
  try{
    var res1 = await Restuser.get_card_info(name)
    console.log('res1',res1)
    var res2 = [{'hit':''}]
    if (isShare) {
      res2 = await Restuser.get_share_info(name)
    }
    ctx.body = {
      "code": 0,
      "data": {"list": res1[0]['hit']+'<br>'+res2[0]['hit']}
    }

  }catch (error) {
    console.error(`sry: ${error.message}`);
    ctx.status = 500;
    ctx.body = { success: false, message: `sry: ${error.message}` };
  }
  
  

})

router.post('/api/get-my-up',async (ctx, next) => {
  const { id } = ctx.request.body;
  console.log('我的：',id)
  if (!id) {
    ctx.status = 400;
    ctx.body = { success: false, message: 'ID 参数缺失' };
    return;
  }
  try{
    const res = await Restuser.get_my_up(id)
    console.log('我的上传：', res )
    ctx.body = {
      "code": 0,
      "data": {"list": res}
  }

  }catch (error) {
    console.error(`搜索个人上传时发生错误: ${error.message}`);
    ctx.status = 500;
    ctx.body = { success: false, message: `搜索个人上传时发生错误: ${error.message}` };
  }
})

router.post('/api/del-doc-by-id',async (ctx, next) => {
  const id = ctx.request.body.sw;
  if (!id) {
    ctx.status = 400;
    ctx.body = { success: false, message: 'ID 参数缺失' };
    return;
  }
  try {
    // 调用 delDoc 方法删除 Elasticsearch 文档
    //const srcFilename = Buffer.from(id).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
    //console.log('删除掉文件id: ',srcFilename)
    const res = await elastic_xy('deleted', id);
    console.log("del_elas: ",res)
    ctx.status = 200
    if (res.result == 'deleted') {
      console.log('删除路径： ',doc_path+id)
      fs.unlinkSync(doc_path+id);  
      const sql_tp = [
        `delete from dev.shares where doc = ?`,
        `delete from dev.doc_record where doc = ?`
      ]
      const params = [
        id,
        id
      ]
      //const del_sql_res = await Restuser.delDeptDoc(id)
      const del_sql_res = await  mysql_trans.transaction(sql_tp, params);
      console.log('删除数据库： ',del_sql_res)
      if (del_sql_res['affectedRows']>0){
        ctx.body = { code :200,success: true, message: '文档和本地文件删除成功' };
        return
      }else{
        ctx.body = { code:200, success: false, message: '库删除fal' };
      }
      
    }
    // 5paH5a2X5paH56i_My5wZGY=
    // 删除本地文件
    
  } catch (error) {
    console.error(`删除文档或文件时发生错误: ${error.message}`);
    ctx.status = 500;
    ctx.body = { success: false, message: `删除文档或文件时发生错误: ${error.message}` };
  }
  
})
async function check_file(param){
  console.log('param: ',param)
  try {  
    let data = JSON.stringify({  
      "sw": param, 
      "st": 0,
      "dept": '',
      "usercode": '',
      "sharesList": [],
      "tags": [],
      "cata": '',
      "owner": ''
    });  
    //console.log('ss_zs_login: ',data)
    let config = {  
      method: 'post',  
      url: 'http://10.0.2.110:2334/check_file',  
      headers: {   
        'Content-Type': 'application/json'  
      },  
      data: data  
    };  
    const response = await axios.request(config);  
    console.log('check: ',response.data['hits'][0])
    let responseData = response.data;  
    return responseData;  
  } catch (error) {  
    console.log(error);  
    throw error; 
  }  
};

router.get('/xyy/pdf/:name', async (ctx) => {
  const pdfName = ctx.params.name;
  console.log(pdfName)
  const pdfPath = path.join(doc_path, pdfName);

  ctx.type = 'application/pdf';
  ctx.body = fs.createReadStream(pdfPath);
});

const tokenVerify = async (ctx, next) => {
  const authHeader = ctx.headers['authorization'];
  console.log('看看请求头：',authHeader)
  if (!authHeader) {
    ctx.status = 401;
    ctx.body = { code: 401, message: '未提供 token' };
    return;
  }

  const token = authHeader.split(' ')[1]; // Bearer token格式
  try {
    const decoded = jwt1.verify(token, JWT_SECRET); // 验证 token
    console.log('看看解码：',decoded)
    ctx.state.user = decoded; // 将用户信息存储在 ctx.state 中
    await next(); // 继续处理后续逻辑
  } catch (err) {
    console.error('Token 验证失败：', err);
    ctx.status = 403; // token 无效
    ctx.body = { code: 403, message: 'token 无效或已过期' };
  }
};


router.post('/api/file', tokenVerify , async (ctx) => {
  const { productName } = ctx.request.body;
  var { usercode } = ctx.request.body;
  const { isSearch } = ctx.request.body;
  console.log('productName: ',productName, usercode, isSearch)
  const filePath = path.join(doc_path, productName);
  usercode =  ctx.state.user.uid
  var check_res = false
  if (!isSearch) {
    const es_res = await check_file(productName)
    const userdept = await User.getUserDept(usercode)
    const checkShareRes = await Restuser.checkShare(productName,usercode,userdept[0].deptcode)
    check_res = es_res['hits'][0]['_source']['attribute']=='1' || 
    (es_res['hits'][0]['_source']['attribute']=='3' && es_res['hits'][0]['_source']['name']==usercode)||
    (es_res['hits'][0]['_source']['attribute']=='2' && userdept[0].deptcode.startsWith(es_res['hits'][0]['_source']['dept']))||
    (checkShareRes.length > 0)
  }else{
    check_res = isSearch
  }
  console.log('文件权限检查结果：',check_res)
  if (!check_res) {
    ctx.status = 200;
    ctx.body = { message: '无权查看', error: true };
    return
  }
  if (fs.existsSync(filePath) && check_res) {
    try {
      // 创建文件流并检查可读性
      const fileStream = fs.createReadStream(filePath);
      if (fileStream.readable) {
        ctx.type = 'application/pdf';
        ctx.status = 200;
        ctx.body = fileStream; // 返回文件流
      } else {
        ctx.status = 200;
        ctx.body = { message: '文件不可读', error:true };
      }
    } catch (err) {
      ctx.status = 200;
      ctx.body = { message: '读取文件出错', error: err.message };
    }
  } else {
    ctx.status = 200;
    ctx.body = { message: '文件未找到', error:true };
  }
});

async function mod_file(sw,attr,cata,tags){
  console.log('param: ',sw,attr,cata,tags)
  try {  
    let data = {  
      "sw": sw, 
      "st": 0,
      "dept": '',
      "usercode": attr,
      "sharesList": [],
      "tags":  tags ,
      "cata": cata ? cata: '',
      "owner": ''
    };  
    //console.log('ss_zs_login: ',data)
    let config = {  
      method: 'post',  
      url: 'http://10.0.2.110:2334/mod_file',  
      headers: {   
        'Content-Type': 'application/json'  
      },  
      data: data  
    };  
    const response = await axios.request(config);  
    console.log('mod_file: ',response)
    let responseData = response.data;  
    return responseData;  
  } catch (error) {  
    console.log(error);  
    throw error; 
  }  
};

router.post('/api/EditDoc',async (ctx, next) => {
  const user = ctx.request.body.user;
  const cata = ctx.request.body.cata;
  const tags = ctx.request.body.tags;
  const doc = ctx.request.body.productName;
  const attribute = ['1','2','3'].includes(ctx.request.body.attribute)?ctx.request.body.attribute:'1';
  console.log('re_upload: cata: ',cata,'user: ',user,'tags: ',tags,'attribute:',attribute)
  const es_res = await mod_file(doc,attribute,cata,tags)
  console.log(es_res.result)
  if (es_res.result == 'updated') {
    try{
      //const result = await  mysql_trans.transaction(sql_tp, params);
      const result = await  Restuser.upDocRecord(doc, parseInt(attribute),  cata, JSON.stringify(tags));
      console.log('doc_record_mod: ',result)
      if(result.affectedRows > 0) {
        ctx.body = {
          "status": "200",
          "success": true,
        }
      }else{
        ctx.body = {
          "status": "500",
          "error": "数据库更新失败，尝试重新修改",
        }
      }
      } catch (error) {
        ctx.status = 500;
        ctx.body = {
          success: false,
          message: error.message,
        };
      }
  }else {  
    ctx.status = 500;  
    
    ctx.body = {error:'解析文档更新失败，请稍后重试'};    
  }  
  
})

router.post('/api/upload', async (ctx, next) => {
  const file = ctx.request.files.file; 
  const user = ctx.request.body.user;
  const cata = ctx.request.body.treee.split(',');
  const tags = ctx.request.body.tags.split(',');
  const attribute = ['1','2','3'].includes(ctx.request.body.attribute)?ctx.request.body.attribute:'1';
  console.log('file: ',cata,user,tags,attribute)
  if (!file || !user) {  
    ctx.status = 400;  
    ctx.body = { error: '尚未登陆'}
    return;  
  }  
  const targetName = sanitizeFilename(file.originalFilename)
  const targetPath = `/home/dev/mp/docs/${targetName}`
  // console.log('targetPath: ',targetPath,'\n',file.filepath)
  try {  
    // 查询是否存在
    var doc_count = await Restuser.getFileCount(targetName)
    // console.log('doc_count: ',doc_count)
    // 查重
    if (doc_count.length > 0 && doc_count[0]['c']>0){
      ctx.status = 202;
      ctx.body = { error: '存在重名文件。'}
      fs.unlinkSync(file.filepath);
      return;
    }
    // 改名
    await new Promise((resolve, reject) => {  
      fs.rename(file.filepath, targetPath, (err) => {  
        if (err) reject(err);  
        else resolve();  
      });  
    });
    // 查文档的部门
    const user_dept = await User.getUserDept(user)
    //console.log('depts: ',user_dept[0]['deptcode'])
    

    // 写入ES
    const esResult = await elastic_xy('created',targetPath,'',user,cata,tags,attribute,user_dept[0]['deptcode']);   
    console.log('esResult: ',esResult)
    // 写入数据库
    if (esResult == 'created'|| esResult=='updated') {  
    // 写入es，如果es写入成功，写入数据库映射关系，否则删除文件
    // var sql_tp = []
    // var params = []
    // for (var i=0; i<depts.length ;i++) {
    //   sql_tp.push(`insert into dev.dept_doc (dept, doc) values(?,?)`)
    //   params.push([depts[i],targetName])
    // }
    // sql_tp.push(`insert into dev.doc_record (doc,ope,uptime) value(?,?,now())`)
    // params.push([targetName,user])
    // console.log('插入文档数据库：',sql_tp,params) 
      try{
        //const result = await  mysql_trans.transaction(sql_tp, params);
        const result = await  Restuser.docRecord(targetName, user, parseInt(attribute), user_dept[0]['deptcode'], cata.length>0?cata[0]:'', JSON.stringify(tags));
        console.log('doc_record: ',result)
        var res_url = ''
        if(targetName.endsWith('.pdf') || targetName.endsWith('.txt')) {
          res_url = `http://10.0.2.110:2334/static/${targetName}`;
        }else{
          res_url = `http://10.0.2.110:2334/static/${targetName}`;
          const encodedUrl = base64.encode(Buffer.from(res_url, 'utf-8').toString('base64'));
          // res_url = 'http://127.0.0.1:8012/onlinePreview?url='+encodeURIComponent(base64.encode(res_url))
          res_url = 'http://10.0.2.110:8012/onlinePreview?url=' + encodeURIComponent(encodedUrl);
          
        }
        ctx.body = {
            "status": "200",
            "success": true,
            "url":res_url
        }} catch (error) {
          ctx.status = 500;
          ctx.body = {
            success: false,
            message: error.message,
          };
        }
    
    
      
    } else {  
      ctx.status = 500;  
      
      ctx.body = {error:'解析文档失败，请稍后重试'};  
      // 删除文件  
      fs.unlinkSync(targetPath);  
    }  
  } catch (error) {  
    ctx.status = 500;  
    ctx.body = 'Internal server error.';  
    // 删除文件  
    fs.unlinkSync(targetPath);  
  }  

});

router.post('/api/re_upload', async (ctx, next) => {
  const file = ctx.request.files.file; 
  const user = ctx.request.body.user;
  const cata = ctx.request.body.cata;
  const tags = ctx.request.body.tags.split(',');
  const attribute = ['1','2','3'].includes(ctx.request.body.attribute)?ctx.request.body.attribute:'1';
  console.log('re_upload: cata: ',cata,'user: ',user,'tags: ',tags,'attribute:',attribute)
  if (!file || !user) {  
    ctx.status = 400;  
    ctx.body = { error: '尚未登陆'}
    return;  
  }  
  const targetName = file.originalFilename
  const targetPath = `/home/dev/mp/docs/${targetName}`
  console.log('targetPath: ',targetPath,'\n',file.filepath)
  
  try {  
    // 删除原文件
    fs.unlinkSync(targetPath);
    // 改名
    await new Promise((resolve, reject) => {  
      fs.rename(file.filepath, targetPath, (err) => {  
        if (err) reject(err);  
        else resolve();  
      });  
    });
    
    // 查文档的部门
    const user_dept = await User.getUserDept(user)
    // 删除原es
    const esResult0 = await elastic_xy('deleted', targetName)
    console.log('修改的上传删除es结果：',esResult0)
    if(esResult0.result == 'deleted'){
      // 写入ES
      const esResult = await elastic_xy('created',targetPath,'',user,cata,tags,attribute,user_dept[0]['deptcode']);   
      console.log('esResult: ',esResult)
      // 写入数据库
      if (esResult == 'created'|| esResult=='updated') {
        try{
          //const result = await  mysql_trans.transaction(sql_tp, params);
          const result = await  Restuser.upDocRecord(targetName,  parseInt(attribute),  cata, JSON.stringify(tags));
          console.log('doc_record: ',result)
          var res_url = ''
          if(targetName.endsWith('.pdf') || targetName.endsWith('.txt')) {
            res_url = `http://10.0.2.110:2334/static/${targetName}`;
          }else{
            res_url = `http://10.0.2.110:2334/static/${targetName}`;
            const encodedUrl = base64.encode(Buffer.from(res_url, 'utf-8').toString('base64'));
            // res_url = 'http://127.0.0.1:8012/onlinePreview?url='+encodeURIComponent(base64.encode(res_url))
            res_url = 'http://10.0.2.110:8012/onlinePreview?url=' + encodeURIComponent(encodedUrl);
            
          }
          ctx.body = {
              "status": "200",
              "success": true,
              "url":res_url
          }} catch (error) {
            ctx.status = 500;
            ctx.body = {
              success: false,
              message: error.message,
            };
          }


        
      } else {  
        ctx.status = 500;  
        
        ctx.body = {error:'解析文档失败，请稍后重试'};  
        // 删除文件  
        fs.unlinkSync(targetPath);  
      } 
    }
     
  } catch (error) {  
    ctx.status = 500;  
    ctx.body = 'Internal server error.';  
    // 删除文件  
    fs.unlinkSync(targetPath);  
  }  

});

async function search_zs(param,st,usercode,dept,sharesList,tags,cata,owner){
  try {  
    //console.log('请求fast: ',param, st, dept, usercode, sharesList, tags, cata, owner)
    let data = JSON.stringify({  
      "sw": param, 
      "st": st,
      "dept": dept,
      "usercode": usercode,
      "sharesList": sharesList,
      "tags": tags,
      "cata": cata,
      "owner": owner
    });  
    //console.log('请求fast: ',data)
    let config = {  
      method: 'post',  
      url: tags.length>0?'http://10.0.2.110:2334/ss_zs_with_tags':'http://10.0.2.110:2334/ss_zs_login',  
      headers: {   
        'Content-Type': 'application/json'  
      },  
      data: data  
    };  
    const response = await axios.request(config);  
    let responseData = response.data;  
    //console.log(responseData)
    return responseData;  
  } catch (error) {  
    console.log(error);  
    throw error; 
  }  
};

function getSnippetWithHighlight(description, highlightTag = '<strong') {
  // 查找高亮标签的位置
  const highlightIndex = description.indexOf(highlightTag);

  if (highlightIndex === -1) {
    // 如果没有找到高亮标签，直接返回原始描述
    return description;
  }

  // 计算截取的起始位置，确保不会超出字符串的起点
  const startIndex = Math.max(0, highlightIndex - 10);

  // 截取高亮标签前10个字符，并拼接后续内容
  const snippet = description.substring(startIndex, highlightIndex + description.length);

  return snippet;
}

router.post('/xyy/get-card-list', async (ctx, next) => {
  const { sw,st,dept,user, tags, cata} = ctx.request.body
  console.log('sw: ',sw, 'st: ',st,'dpt: ',dept,'user: ',user,'tags: ', tags, 'cata:',cata)
  if (!sw || sw.length === 0 || !user) {
    ctx.body = {
      "code": 200,
      "data": {"list": []}
    }
    return 
  }
  const userDept = await User.getUserDept(user)
  console.log('deptcode: ',userDept[0]['deptcode'])
  const sharesList = await Restuser.getShare(userDept[0]['deptcode'],user)
  // console.log('sharesList: ',sharesList)
  const shareList1 = sharesList.map(item => item.doc)
  var res
  
  res = await search_zs(ctx.request.body.sw, ctx.request.body.st, ctx.request.body.user, userDept.length > 0?userDept[0]['deptcode']:'',shareList1,tags, cata===undefined?'':cata)
   
   const  res_1 = []
   const type_dic = {
    "pdf":1,
    "doc":2,
    "docx":2,
    "xls":3,
    "xlsx":3,
    "ppt":4,
    "pptx":4,
    "txt":0,
    "js":0,
    "py":0,
    "md":0
  
   }
   // "description": res[i]['_source']['attachments'][0]['attachment']['content'],
   if (res['hits'].length > 0){
    for (var i in res['hits']){
      // console.log(res['hits'][i])
        res_1.push({
          "owner": res['hits'][i]['_source']['name'],
          "name": res['hits'][i]['highlight']['attachments.filename']?getSnippetWithHighlight(res['hits'][i]['highlight']['attachments.filename'][0]):res['hits'][i]['_source']['attachments'][0]['filename'],
          "description": res['hits'][i]['highlight']['attachments.attachment.content']?getSnippetWithHighlight(res['hits'][i]['highlight']['attachments.attachment.content'][0]):res['hits'][i]['_source']['attachments'][0]['attachment']['content'].slice(0,50),
          "mode_time": res['hits'][i]['_source']['attachments'][0]['attachment']['modified'].substring(0,10),
          "index": parseInt(i),
          "isSetup": res['hits'][i]['_source']['attribute'],
          // "banner": "https://pic.pngsucai.com/00/87/33/aaaaa74a6bd5881f.webp",
          "banner": res['total']['value'],
          "type": type_dic[res['hits'][i]['_source']['attachments'][0]['filename'].split('.').pop()],
          "tags": res['hits'][i]['_source']['tags'],
          "cata": res['hits'][i]['_source']['cata'],
          "attr": res['hits'][i]['_source']['attribute'],
          "isShare": shareList1.includes(res['hits'][i]['_source']['attachments'][0]['filename'])
        })
     }
    //  ctx.body = {
    //     "code": 200,
    //     "data": {"list": res_1}
    //  }
   }
   ctx.body = {
    "code": 200,
    "data": {"list": res_1}
 }
   
  
  
  });



router.post('/api/get-card-list', tokenVerify ,async (ctx, next) => {
  var { sw,st,dept,user, tags, cata} = ctx.request.body
  const state_user = ctx.state.user.uid
  console.log('sw: ',sw, 'st: ',st,'dpt: ',dept,'user: ',state_user,'tags: ', tags, 'cata:',cata)
  
  if ((!sw || sw.length === 0) && user.length == 0) {
    ctx.body = {
      "code": 200,
      "data": {"list": []}
    }
    return 
  }
  const owner = user
  user = state_user
  
  
  console.log('owner', owner, 'user', user )
  const userDept = await User.getUserDept(user)
  console.log('deptcode: ',userDept[0]['deptcode'])
  const sharesList = await Restuser.getShare(userDept[0]['deptcode'],user)
  // console.log('sharesList: ',sharesList)
  const shareList1 = sharesList.map(item => item.doc)
  // if (owner.length() > 0) {
    
  // }
  // 
  var res
  
  res = await search_zs(sw, st, user, userDept.length > 0?userDept[0]['deptcode']:'',shareList1,tags, cata===undefined?'':cata, owner)
   
   const  res_1 = []
   const type_dic = {
    "pdf":1,
    "doc":2,
    "docx":2,
    "xls":3,
    "xlsx":3,
    "ppt":4,
    "pptx":4,
    "txt":0,
    "js":0,
    "py":0,
    "md":0
   }
   // "description": res[i]['_source']['attachments'][0]['attachment']['content'],
   if (res['hits'].length > 0 && sw!='all' && sw!=''){
    for (var i in res['hits']){
       console.log(res['hits'][i]['_source']['attachments'][0]['filename'],res['hits'][i]['_source']['attachments'][0]['attachment']['modified'])
        res_1.push({
          "owner": res['hits'][i]['_source']['name'],
          "name": res['hits'][i]['highlight']['attachments.filename']?getSnippetWithHighlight(res['hits'][i]['highlight']['attachments.filename'][0]):res['hits'][i]['_source']['attachments'][0]['filename'],
          "description": res['hits'][i]['highlight']['attachments.attachment.content']?getSnippetWithHighlight(res['hits'][i]['highlight']['attachments.attachment.content'][0]):res['hits'][i]['_source']['attachments'][0]['attachment']['content'].slice(0,50),
          "mode_time": res['hits'][i]['_source']['attachments'][0]['attachment']['modified']?res['hits'][i]['_source']['attachments'][0]['attachment']['modified'].substring(0,10):'',
          "index": parseInt(i),
          "isSetup": res['hits'][i]['_source']['attribute'],
          // "banner": "https://pic.pngsucai.com/00/87/33/aaaaa74a6bd5881f.webp",
          "banner": res['total']['value'],
          "type": type_dic[res['hits'][i]['_source']['attachments'][0]['filename'].split('.').pop()],
          "tags": res['hits'][i]['_source']['tags'],
          "cata": res['hits'][i]['_source']['cata'],
          "attr": res['hits'][i]['_source']['attribute'],
          "isShare": shareList1.includes(res['hits'][i]['_source']['attachments'][0]['filename'])
        })
     }
    
   }
   if (res['hits'].length > 0 && (sw=='all' || owner!='')){
    for (var i in res['hits']){
      // console.log(res['hits'][i])
        res_1.push({
          "owner": res['hits'][i]['_source']['name'],
          "name": res['hits'][i]['_source']['attachments'][0]['filename'],
          "description": res['hits'][i]['_source']['attachments'][0]['attachment']['content'].slice(0,50),
          "mode_time": res['hits'][i]['_source']['attachments'][0]['attachment']['modified'].substring(0,10),
          "index": parseInt(i),
          "isSetup": res['hits'][i]['_source']['attribute'],
          // "banner": "https://pic.pngsucai.com/00/87/33/aaaaa74a6bd5881f.webp",
          "banner": res['total']['value'],
          "type": type_dic[res['hits'][i]['_source']['attachments'][0]['filename'].split('.').pop()],
          "tags": res['hits'][i]['_source']['tags'],
          "cata": res['hits'][i]['_source']['cata'],
          "attr": res['hits'][i]['_source']['attribute'],
          "isShare": shareList1.includes(res['hits'][i]['_source']['attachments'][0]['filename'])
        })
     }
    
   }
   ctx.body = {
    "code": 200,
    "data": {"list": res_1}
 }
   
  
  
  });

  router.get('/api/get-menu-list-i18n', async (ctx, next) => {
    console.log('看看菜单：', ctx.request.query);
  
    // 检查查询参数中的 name 是否为 10030203
    const userName = ctx.request.query.name;
  
    const baseMenu = {
      path: "/list",
      name: "list",
      component: "LAYOUT",
      redirect: "/list/base",
      meta: {
        title: {
          zh_CN: "文档模块",
          en_US: "List"
        },
        icon: "view-list"
      },
      children: [
        {
          path: "card",
          name: "ListCard",
          component: "/list/card/index",
          meta: {
            title: {
              zh_CN: "文档列表",
              en_US: "Card List"
            }
          }
        },
        {
          path: "tree",
          name: "ListTree",
          component: "/list/tree/index",
          meta: {
            title: {
              zh_CN: "文档上传",
              en_US: "Tree List"
            }
          }
        }
      ]
    };
  
    
    if (userName === '10030203') {
      baseMenu.children.push({
        "path": "base",
        "name": "ListBase",
        "component": "/list/base/index",
        "meta": {
        "title": {
            "zh_CN": "目录维护",
            "en_US": "Base List"
          }
        }
      });
      baseMenu.children.push({
        "path": "test",
        "name": "TestIndex",
        "component": "/test/index",
        "meta": {
        "title": {
            "zh_CN": "测试页面",
            "en_US": "Base List"
          }
        }
      });
    }
  
    ctx.body = {
      code: 0,
      data: {
        list: [baseMenu]
      }
    };
  });
  

  router.get('/api/get-menu-list-i18n/bak', async (ctx, next) => {
    console.log('看看菜单：',ctx.request.query)
    const userName = ctx.request.query.name;

    ctx.body = {
      "code": 0,
      "data": {
          "list": [
              {
                  "path": "/list",
                  "name": "list",
                  "component": "LAYOUT",
                  "redirect": "/list/base",
                  "meta": {
                      "title": {
                          "zh_CN": "文档模块",
                          "en_US": "List"
                      },
                      "icon": "view-list"
                  },
                  "children": [
                      // {
                      //     "path": "base",
                      //     "name": "ListBase",
                      //     "component": "/list/base/index",
                      //     "meta": {
                      //         "title": {
                      //             "zh_CN": "目录维护",
                      //             "en_US": "Base List"
                      //         }
                      //     }
                      // },
                      {
                          "path": "card",
                          "name": "ListCard",
                          "component": "/list/card/index",
                          "meta": {
                              "title": {
                                  "zh_CN": "文档列表",
                                  "en_US": "Card List"
                              }
                          }
                      },
                      // {
                      //     "path": "filter",
                      //     "name": "ListFilter",
                      //     "component": "/list/filter/index",
                      //     "meta": {
                      //         "title": {
                      //             "zh_CN": "筛选列表页",
                      //             "en_US": "Filter List"
                      //         }
                      //     }
                      // },
                      {
                          "path": "tree",
                          "name": "ListTree",
                          "component": "/list/tree/index",
                          "meta": {
                              "title": {
                                  "zh_CN": "文档上传",
                                  "en_US": "Tree List"
                              }
                          }
                      }
                  ]
              },
              // {
              //     "path": "/form",
              //     "name": "form",
              //     "component": "LAYOUT",
              //     "redirect": "/form/base",
              //     "meta": {
              //         "title": {
              //             "zh_CN": "表单页",
              //             "en_US": "Form"
              //         },
              //         "icon": "edit-1"
              //     },
              //     "children": [
              //         {
              //             "path": "base",
              //             "name": "FormBase",
              //             "component": "/form/base/index",
              //             "meta": {
              //                 "title": {
              //                     "zh_CN": "基础表单页",
              //                     "en_US": "Base Form"
              //                 }
              //             }
              //         },
              //         {
              //             "path": "step",
              //             "name": "FormStep",
              //             "component": "/form/step/index",
              //             "meta": {
              //                 "title": {
              //                     "zh_CN": "分步表单页",
              //                     "en_US": "Step Form"
              //                 }
              //             }
              //         }
              //     ]
              // },
              // {
              //     "path": "/detail",
              //     "name": "detail",
              //     "component": "LAYOUT",
              //     "redirect": "/detail/base",
              //     "meta": {
              //         "title": {
              //             "zh_CN": "详情页",
              //             "en_US": "Detail"
              //         },
              //         "icon": "layers"
              //     },
              //     "children": [
              //         {
              //             "path": "base",
              //             "name": "DetailBase",
              //             "component": "/detail/base/index",
              //             "meta": {
              //                 "title": {
              //                     "zh_CN": "基础详情页",
              //                     "en_US": "Base Detail"
              //                 }
              //             }
              //         },
              //         {
              //             "path": "advanced",
              //             "name": "DetailAdvanced",
              //             "component": "/detail/advanced/index",
              //             "meta": {
              //                 "title": {
              //                     "zh_CN": "多卡片详情页",
              //                     "en_US": "Card Detail"
              //                 }
              //             }
              //         },
              //         {
              //             "path": "deploy",
              //             "name": "DetailDeploy",
              //             "component": "/detail/deploy/index",
              //             "meta": {
              //                 "title": {
              //                     "zh_CN": "数据详情页",
              //                     "en_US": "Data Detail"
              //                 }
              //             }
              //         },
              //         {
              //             "path": "secondary",
              //             "name": "DetailSecondary",
              //             "component": "/detail/secondary/index",
              //             "meta": {
              //                 "title": {
              //                     "zh_CN": "二级详情页",
              //                     "en_US": "Secondary Detail"
              //                 }
              //             }
              //         }
              //     ]
              // },
              // {
              //     "path": "/frame",
              //     "name": "Frame",
              //     "component": "Layout",
              //     "redirect": "/frame/doc",
              //     "meta": {
              //         "icon": "internet",
              //         "title": {
              //             "zh_CN": "外部页面",
              //             "en_US": "External"
              //         }
              //     },
              //     "children": [
              //         {
              //             "path": "doc",
              //             "name": "Doc",
              //             "component": "IFrame",
              //             "meta": {
              //                 "frameSrc": "https://tdesign.tencent.com/starter/docs/vue-next/get-started",
              //                 "title": {
              //                     "zh_CN": "使用文档（内嵌）",
              //                     "en_US": "Documentation(IFrame)"
              //                 }
              //             }
              //         },
              //         {
              //             "path": "TDesign",
              //             "name": "TDesign",
              //             "component": "IFrame",
              //             "meta": {
              //                 "frameSrc": "https://tdesign.tencent.com/vue-next/getting-started",
              //                 "title": {
              //                     "zh_CN": "TDesign 文档（内嵌）",
              //                     "en_US": "TDesign (IFrame)"
              //                 }
              //             }
              //         },
              //         {
              //             "path": "TDesign2",
              //             "name": "TDesign2",
              //             "component": "IFrame",
              //             "meta": {
              //                 "frameSrc": "https://tdesign.tencent.com/vue-next/getting-started",
              //                 "frameBlank": true,
              //                 "title": {
              //                     "zh_CN": "TDesign 文档（外链",
              //                     "en_US": "TDesign Doc(Link)"
              //                 }
              //             }
              //         }
              //     ]
              // }
          ]
      }
  }
  });

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