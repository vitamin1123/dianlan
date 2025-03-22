// 员工和班组和班组长
select b.name as class_name,c.name as factory_name,d.name as leader_name,d.work_id as leader_id,a.id,a.name,a.work_id,a.work_post_id from yzjlx_erp.employee a 
left join  yzjlx_erp.work_class b on a.class_id = b.id 
left join yzjlx_erp.factory c on b.factory_id = c.id
left join yzjlx_erp.employee d on b.class_monitor = d.id

// 项目
select a.* ,b.name from yzjlx_erp.ship a left join yzjlx_erp.work_class b on a.class_id = b.id

// 区域
id,name,ship_id,parent_id,group_monitor(班组长employee id)
select * from yzjlx_erp.ship_area a left join yzjlx_erp.ship b on a.ship_id = b.id


// 每个系列一个电缆册，一个当前版本的价目表
// 拉线的时候 区域已经有相应的班组长了，就是它的位置