const db = require('../db/db_mysql.js');

const dbconfig = require('../db/myconfig_127.js')


module.exports = {
    //新增用户
    // async addUser (name,age) {
    //     let res = await SQLQuery(`insert into users (name,age) values ('${name}','${age}')`);
    //     return res
    // },
    //获取用户列表

    
    
    async getPwd (user) {
        //console.log('emp_code: ',emp_code)
        try {
            let res = await db.query(`select usercode,password,username from dev.user where usercode =?`,[user],dbconfig)
            return res
        } catch (error) {
            console.log('error: ',error)
        }
        // let res = await db.query(`select usercode,password,username from dev.user where usercode = ?`,[user],dbconfig)
        // //console.log('contro_res:  ',res)
        // return res
    },
    // updatePwd
    async updatePwd (user,pwd) {
        try {
            let res = await db.query(`update dev.user set password =? where usercode =?`,[pwd,user],dbconfig)
            return res
        } catch (error) {
            console.log('error: ',error)
        }
    },
    //getUserName
    async getUserName(usercode){
        try {
            let res = await db.query(`select username from dev.user where usercode =?`,[usercode],dbconfig)
            return res
        } catch (error) {
            console.log('error: ',error)
        }
    },
    //getUserInfo
    async getUserInfo(usercode){
        try {
            let res = await db.query(`select username,role,case role when 1 then '超级管理员' when 2 then '管理员' when 3 then '生产主管'
when 4 then '班组长' else '施工员'  end as rolename from dev.user where state = 1 and usercode=?`,[usercode],dbconfig)
            return res
        } catch (error) {
            console.log('error: ',error)
        }
    },
    async getFileCount (doc) {
        //console.log('emp_code: ',emp_code)
        let res = await db.query(`select 1 as c from dev.doc_record where doc = ? limit 1`,[doc],dbconfig)
        //console.log('contro_res:  ',res)
        return res
    },
    async delDeptDoc (doc) {
        let res = await db.query(`delete from dev.dept_doc where doc = ?`,[doc],dbconfig)
        return res
    },

    

    async docRecord (doc, ope, attr, dept, cata, tags) {
        let res = await db.query(`insert into dev.doc_record (doc,ope,up_time,attr,dept, cata, tags) value(?,?,now(),?,?,?,?)`,[doc,ope,attr,dept,cata,tags],dbconfig)
        return res
    },

    
    async upDocRecord (doc,  attr,  cata, tags) {
        let res = await db.query(`update dev.doc_record set up_time=now(),attr=?, cata=?, tags=? where doc=?;`,[attr,cata,tags,doc],dbconfig)
        return res
    },

    async searchUser () {
        let res = await db.query(`select user as number,name from dev.user;`,[],dbconfig)
        
        return res
        
    },

    
    async delShareById (id,ope) {
        let res = await db.query(`delete from dev.shares where id=? and ope=?;`,[id,ope],dbconfig)
        return res
    },

    async get_my_up (id) {
        let res = await db.query(`select ROW_NUMBER() OVER (ORDER BY a.up_time desc) as 'index',a.doc as name,a.attr as attr,b.name as cata,a.cata as cataId,a.tags as description,a.up_time as banner  from dev.doc_record a left join dev.cata b on a.cata = b.code where a.ope = ?;`,[id],dbconfig)
        
        return res
    },

    async get_card_info (id) {
        
        let res = await db.query(`select concat(b.name,' 于 ',a.up_time,' 上传') as hit from dev.doc_record a left join dev.user b on a.ope = b.user where a.doc = ?;`,[id],dbconfig)
        
        return res
    },

    async get_share_info (id) {
        
        let res = await db.query(`select 
        concat(' 于',a.ope_time,' 分享给你','<br><strong>',TIMESTAMPDIFF(HOUR, now(), a.endtime),'</strong>小时后到期') as hit
        from dev.shares a left join dev.user b on a.ope = b.user where a.doc= ?;`,[id],dbconfig)
        
        return res
    },

    async getCataListTree () {
        //console.log('emp_code: ',emp_code)
        
        var res = await db.query(`select a.name,a.isdisabled as status,a.code as no,b.name as adminName from dev.cata a left join dev.user b on a.type=b.user;`,[],dbconfig)
        var res1 = []
        for (let i = 0; i < res.length; i++) {
          var tp = {}
          tp.label = res[i].name
          tp.value = res[i].no
          tp.status = res[i].status
          //tp.adminName = res[i].adminName
          tp.children = []
          res1.push(tp)
        }
        return res1
      },

      async getCataList () {
        //console.log('emp_code: ',emp_code)
        
        let res = await db.query(`select a.name,a.isdisabled as status,a.code as no,b.name as adminName from dev.cata a left join dev.user b on a.type=b.user;`,[],dbconfig)
        //console.log('contro_res:  ',res)
        return res
      },

    async getShare (sdept,suser) {
        //console.log('emp_code: ',emp_code)
        
        let res = await db.query(`SELECT distinct(doc) FROM dev.shares where type=1 and share like ? and (endtime is null or endtime > now()) union all
SELECT distinct(doc) FROM dev.shares where type=2 and share=? and (endtime is null or endtime > now());`,[sdept+'%',suser],dbconfig)
        //console.log('contro_res:  ',res)
        return res
    },

    async getRecentUp (id) {
        //console.log('emp_code: ',emp_code)
        let res
        if (id == 0) {
            res = await db.query(`SELECT a.doc as productName,b.name as count,CONCAT(TIMESTAMPDIFF(HOUR, a.up_time, now()),'小时前') as growUp FROM dev.doc_record a 
                left join dev.user b on a.ope=b.user order by a.up_time desc limit 10;`,[],dbconfig)
        }else if (id == 1) {
            res = await db.query(`SELECT a.doc as productName,b.name as count,CONCAT(TIMESTAMPDIFF(HOUR, a.up_time, now()),'小时前') as growUp FROM dev.doc_record a 
                left join dev.user b on a.ope=b.user where a.attr = 1 order by a.up_time desc limit 3;`,[],dbconfig)

        }
        
        //console.log('contro_res:  ',res)
        return res
      },

      async getUpNum (id) {
        //console.log('emp_code: ',emp_code)
        let res
        if (id.length == 0) {
            res = await db.query(`SELECT 
    u.name,
    total.ope,
	total.total_upload_count,
    IFNULL(this_month.this_month_upload_count, 0) AS this_month_upload_count
FROM 
    (
        SELECT 
            ope, 
            COUNT(*) AS total_upload_count
        FROM 
            dev.doc_record
        GROUP BY 
            ope
    ) AS total
LEFT JOIN 
    (
        SELECT 
            ope, 
            COUNT(*) AS this_month_upload_count
        FROM 
            dev.doc_record
        WHERE 
            YEAR(up_time) = YEAR(CURDATE()) 
            AND MONTH(up_time) = MONTH(CURDATE())
        GROUP BY 
            ope
    ) AS this_month
ON total.ope = this_month.ope
left join dev.user u on total.ope = u.user
order by total.total_upload_count desc limit 12;`,[],dbconfig)
        }else {
            res = await db.query(`SELECT 
    u.name,
    total.ope,
	total.total_upload_count,
    IFNULL(this_month.this_month_upload_count, 0) AS this_month_upload_count
FROM 
    (
        SELECT 
            ope, 
            COUNT(*) AS total_upload_count
        FROM 
            dev.doc_record
        GROUP BY 
            ope
    ) AS total
LEFT JOIN 
    (
        SELECT 
            ope, 
            COUNT(*) AS this_month_upload_count
        FROM 
            dev.doc_record
        WHERE 
            YEAR(up_time) = YEAR(CURDATE()) 
            AND MONTH(up_time) = MONTH(CURDATE())
        GROUP BY 
            ope
    ) AS this_month
ON total.ope = this_month.ope 
left join dev.user u on total.ope = u.user where u.name = ?;`,[id],dbconfig)

        }
        
        //console.log('contro_res:  ',res)
        return res
      },
      
      
      async checkShare (a,b,c) {
        //console.log('emp_code: ',emp_code)
        
        let res = await db.query(`SELECT * FROM dev.shares where doc = ? and (endtime IS NULL OR endtime > NOW()) AND ((type = 1 AND share like ?)  OR (type = 2 AND share = ?));`,[a,c+'%',b],dbconfig)
        return res
      },
      //getRankShares
      async getRankShares (id,type,dept) {
        //console.log('emp_code: ',emp_code)
        // date_format(MAX(a.ope_time),'%Y-%m-%d %H:%I:%s') AS growUp
        let res
        if (type == 'fromOther') {
            res = await db.query(`SELECT 
    a.doc AS productName, 
    b.name AS count, 
    CASE   
        WHEN MAX(a.endtime) is null THEN
			'永久'
        WHEN MAX(a.endtime) > NOW() THEN   
            CONCAT(TIMESTAMPDIFF(DAY, NOW(), MAX(a.endtime)), '天后')  
        ELSE   
            '已到期'  
    END as growUp
FROM 
    dev.shares a 
LEFT JOIN 
    dev.user b 
ON 
    a.ope = b.user
WHERE 
    (a.type = 1 AND a.share LIKE ?) 
    OR (a.type = 2 AND a.share = ?)
GROUP BY 
    a.doc, a.type, a.share, b.name
ORDER BY 
    MAX(a.endtime) DESC
LIMIT 10;
`,[dept+'%',id],dbconfig)
        }else if (type == 'toOther') {
            res = await db.query(`SELECT 
	a.id,a.doc as productName ,
    CASE 
        WHEN a.type = 2 THEN b.name 
        ELSE a.share 
    END AS count, 
    CASE   
    WHEN a.endtime is null THEN
			'永久'
    WHEN a.endtime > now() THEN   
        CONCAT(TIMESTAMPDIFF(DAY, now(), a.endtime), '天后')  
    ELSE   
        '已到期'  
END
    as growUp
FROM 
    dev.shares a
LEFT JOIN 
    dev.user b 
ON 
    a.share = b.user 
WHERE
	a.ope = ?
ORDER BY 
    a.ope_time DESC limit 10;`,[id],dbconfig)

        }
        return res
      },
    
}
