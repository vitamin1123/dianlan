select a.*,b.name,c.name,d.name from yzjlx_erp.employee a 
left join  yzjlx_erp.work_class b on a.class_id = b.id 
left join yzjlx_erp.factory c on b.factory_id = c.id
left join yzjlx_erp.employee d on b.class_monitor = d.id