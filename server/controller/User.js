const db = require('../db/db.js');
const db_oa_test = require('../db/db_oa_test.js');
const dbconfig = require('../db/msconfig.js')
function func_console_log(e){
    console.log('什么鸡鸡回调',e);
}

module.exports = {
    //新增用户
    // async addUser (name,age) {
    //     let res = await SQLQuery(`insert into users (name,age) values ('${name}','${age}')`);
    //     return res
    // },
    //获取用户列表

    async getUserList_xiashu (arr) {
        var haha = ""
        if (Object.keys(arr).length == 0 ) {
            return {}
        }
        for(var key in arr) {
            if (arr[key].length>0){
                haha+=("'"+arr[key]+"',")
            }
            
        }
        haha = haha.slice(0, -1);
        //console.log('haha',haha)
        //let userlist = db.querySql(`select top 20 * from T_BD_Person where fid not in (select top 20 fid from T_BD_Person);`,{page:page,page_rows:page_rows},func_console_log).recordset;
        let userlist =await db_oa_test.query(`select code,name from ORG_MEMBER where code in (`+haha+`)`);
        //console.log('haha',userlist.recordset)
        return userlist.recordset
    },
    
    async getUserList_bumen (param) {
        console.log('param: ',param)
        //let userlist = db.querySql(`select top 20 * from T_BD_Person where fid not in (select top 20 fid from T_BD_Person);`,{page:page,page_rows:page_rows},func_console_log).recordset;
        //let userlist =await db.query(`select top (@page_rows) * from T_BD_Person where fid not in (select top(@page) fid from T_BD_Person)`,{page:page,page_rows:page_rows});
        let userlist =await db_oa_test.query(`select * from (select b.code dpt_code,a.name emp_name,a.code emp_code from ORG_MEMBER a left join ORG_UNIT b on a.ORG_DEPARTMENT_ID = b.id) as al where al.dpt_code = @a`,{a:param})

        return userlist.recordset
    },

    async getUserList (page,page_rows) {
        
        //let userlist = db.querySql(`select top 20 * from T_BD_Person where fid not in (select top 20 fid from T_BD_Person);`,{page:page,page_rows:page_rows},func_console_log).recordset;
        let userlist =await db.query(`select top (@page_rows) * from T_BD_Person where fid not in (select top(@page) fid from T_BD_Person)`,{page:page,page_rows:page_rows},dbconfig);
       
        return userlist.recordset
    },

    async getUserInfo (id) {
        
        
        let userlist =await db.query(`select DATEDIFF(day,fhiredate,GETDATE()) as days,fname_l2 as name,fnumber from t_bd_person where fnumber =@id`,{id:id},dbconfig);
       
        return userlist.recordset
    },

    async getUserDept (id) {
            //SELECT a.[FName_L2] as username,a.[FNumber] as usercode,b.FName_L2 as dept,b.fnumber as deptcode FROM [YZJ_DATA].[dbo].[T_BD_Person] a  left join [YZJ_DATA].[dbo].[T_ORG_Admin] b on a.[FGKAdmin] = b.[FID] where a.fnumber =
        //  '10031653'
        let userlist =await db.query(`select  t.FName_L2 as username,t.[FNumber] as usercode,o.FName_L2 as dept,o.fnumber as deptcode from T_BD_Person t
left join T_HR_PersonPosition h on t.fid=h.FPersonID
left join T_ORG_Admin o on h.FPersonDep=o.FID
where t.fnumber = @id`,{id:id},dbconfig);
    
        return userlist.recordset
    },

    async getOrgList_v2 (){
        
            // 执行数据库查询，建议分页处理
            const orglist = await db.query(
                `SELECT FID, FName_L2, FNumber, FLongNumber, FParentID, FIsLeaf, FLevel, FSortCode 
                FROM T_ORG_Admin 
                WHERE FIsSealUp = 0 AND FIsStart = 0 AND 
                      (fnumber = 'YZ' OR fnumber LIKE 'XC%' OR fnumber LIKE 'XF%' OR fnumber LIKE 'SJ%') 
                ORDER BY FLevel DESC, FSortCode`, 
                {}, 
                dbconfig
            );
        
            const res_data = {};  // 最终的树形结构
            const tpp = {};       // 临时存储父子关系
        
            // 遍历记录集，构建树形结构
            orglist.recordset.forEach(record => {
                const { FName_L2, FNumber, FID, FLongNumber, FIsLeaf, FParentID } = record;
        
                // 获取父节点路径
                const stra_parent_num = FLongNumber.split('!').slice(0, -1).join('!');
                const obj_tp = {
                    label: FName_L2,
                    value: FNumber,
                    org_num: FID,
                    org_long_num: FLongNumber,
                    children: FIsLeaf === 0 ? tpp[FLongNumber] || [] : []
                };
        
                // 将当前节点加入其父节点的子节点中
                tpp[stra_parent_num] = tpp[stra_parent_num] || [];
                tpp[stra_parent_num].push(obj_tp);
        
                // 根节点
                if (!FParentID) {
                    res_data.label = FName_L2;
                    res_data.value = FNumber;
                    res_data.org_num = FID;
                    res_data.disabled = true;
                    res_data.org_long_num = FLongNumber;
                    res_data.children = obj_tp.children;
                }
            });
        
            return { list: [res_data] };
        
        
    },

    async getOrgList () {
        
        //let userlist = db.querySql(`select top 20 * from T_BD_Person where fid not in (select top 20 fid from T_BD_Person);`,{page:page,page_rows:page_rows},func_console_log).recordset;
        let orglist =await db.query(`select FID,FName_L2,FNumber,FLongNumber,FParentID,FIndex,FIsLeaf,FLevel,FSortCode from T_ORG_Admin where FIsSealUp = 0 and FIsStart=0 and (fnumber = 'YZ' or fnumber like 'XC%' or fnumber like 'XF%' or fnumber like 'SJ%')  order by FLevel desc,FSortCode`,{},dbconfig);
        // let mana = await db_oa_test.query(`select e.code emp_code,e.NAME emp_name, c.code dep_code, c.name dep_name, d.NAME pos_name
        // from ORG_RELATIONSHIP a left join ORG_UNIT b on a.ORG_ACCOUNT_ID=b.id  
        // left join ORG_UNIT c on a.OBJECTIVE0_ID = c.id
        // left join ORG_ROLE d on a.OBJECTIVE1_ID = d.ID
        // left join ORG_MEMBER e on a.SOURCE_ID = e.id
        // where a.type = 'Member_Role' and d.name <> 'GeneralStaff' and e.IS_ENABLE = 1 and (d.NAME = '部门班组长' or d.NAME = 'DepManager')`)
        var res_data = {}
        //tp_level = -1
        var tpp = {}
        // var dep_mana = {}
        // var dep_zuzhang = {}
        // for(var i = 0;i<mana.recordset.length;i++) {
        //     if (mana.recordset[i]['pos_name'] == '部门班组长'){
        //         if (mana.recordset[i]['dep_code'] in dep_zuzhang){
        //             dep_zuzhang[mana.recordset[i]['dep_code']].push(mana.recordset[i]['emp_code'])
        //         }else {
        //             dep_zuzhang[mana.recordset[i]['dep_code']] = [mana.recordset[i]['emp_code']]
        //         }
        //     } else {
        //         if (mana.recordset[i]['dep_code'] in dep_mana){
        //             dep_mana[mana.recordset[i]['dep_code']].push(mana.recordset[i]['emp_code'])
        //         }else {
        //             dep_mana[mana.recordset[i]['dep_code']] = [mana.recordset[i]['emp_code']]
        //         }
        //     }
        // }
        for(var i = 0;i<orglist.recordset.length;i++) {
            
            var fa_arr = orglist.recordset[i]['FLongNumber'].split('!')
            var stra_parent_num = fa_arr.slice(0,-1).join('!')
            //console.log(stra_parent_num)

            var obj_tp = {
                'label': orglist.recordset[i]['FName_L2'],
                'value' : orglist.recordset[i]['FNumber'],
                'org_num' : orglist.recordset[i]['FID'],
                'org_long_num': orglist.recordset[i]['FLongNumber'],
                
                // 'manager': dep_mana[orglist.recordset[i]['FNumber']],
                // 'zuzhang': dep_zuzhang[orglist.recordset[i]['FNumber']],
                'children': []
            }
            // 非叶子结点
            if(orglist.recordset[i]['FIsLeaf'] == 0) {
                obj_tp['children'] = tpp[obj_tp['org_long_num']];
            }
            if(!(stra_parent_num in tpp)){
                tpp[stra_parent_num] = [obj_tp]
            }else{
                tpp[stra_parent_num].push(obj_tp)
            }

            if (!orglist.recordset[i]['FParentID']) {
                res_data['label'] = orglist.recordset[i]['FName_L2'];
                res_data['value'] = orglist.recordset[i]['FNumber'];
                res_data['org_num'] = orglist.recordset[i]['FID'];
                res_data['org_long_num']= orglist.recordset[i]['FLongNumber'],
                res_data['children'] = tpp[obj_tp['org_long_num']];
                //res_data = {[orglist.recordset[i]['FNumber']]:res_data}
                //tp_level = orglist.recordset[i]['FLevel'];
                //continue;
            }
        }
        
        return {'list':[res_data]};
        //return orglist.recordset;
    },
    //更新用户列表
    // async updateUserList(name,age){
    //     let res = await SQLQuery(`update users set age = ${age} where name = '${name}'`)
    //     return res
    // },
    //删除用户
    // async delUser(id){
    //     let res = await SQLQuery(`delete from users where id = ${id}`)
    //     return res
    // }
}
