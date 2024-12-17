const XLSX = require('xlsx');
const path = require('path');
const { transaction } = require('./db/mysql_trans_110'); // 替换为实际的文件路径

// 随机选择一个项目编号（proj）
function getRandomProj() {
  const projList = ['YZJ2022-1453', 'YZJ2022-1454'];
  return projList[Math.floor(Math.random() * projList.length)];
}

// 随机选择一个公司名称（company）
function getRandomCompany() {
  const companyList = ['新扬子', '鑫福', '三井'];
  return companyList[Math.floor(Math.random() * companyList.length)];
}

// 处理 D 列中的数据
function processSpecification(specification) {
  // 替换 'X' 为 '*' 和 '+E' 为 ''
  return specification.replace(/X/g, '*').replace(/\+E/g, '');
}

// 读取 Excel 并提取相关数据
function readExcel(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[2]];

  // 获取工作表的有效范围
  const range = XLSX.utils.decode_range(sheet['!ref']); // 获取 Excel 的有效范围
  const startRow = 4;  // 从第5行开始读取（0-based 索引）

  // 设置 range 的开始行，保证读取从第5行开始的数据
  range.s.r = startRow; // 设置起始行（0-based）
  sheet['!ref'] = XLSX.utils.encode_range(range); // 更新范围

  // 将表格数据转换为 JSON 格式
  const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // 提取数据
  const data = [];
  for (let i = 0; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (true) { // 确保数据不为空
      const proj_tmp = getRandomProj();
      const company_tmp = getRandomCompany();
      data.push({
        daihao: row[1], // B列：daihao
        model: row[2],   // C列：model
        specification: processSpecification(row[3]),  // D列：specification，进行替换处理
        facilities_name: row[4],
        facilities: row[5],     // J列：facilities
        facilities_loca: row[6],
        proj: proj_tmp,
        company: company_tmp,
        total_length: row[13],
        sysname: row[14]
      });
      data.push({
        daihao: row[1], // B列：daihao
        model: row[2],   // C列：model
        specification: processSpecification(row[3]),  // D列：specification，进行替换处理
        facilities_name: row[8],
        facilities: row[9],     // J列：facilities
        facilities_loca: row[10],
        proj: proj_tmp,
        company: company_tmp,
        total_length: row[13],
        sysname: row[14]
      });
      
    }
  }
  return data;
}

// 批量插入数据到数据库
async function insertData(data) {
  if (!data.length) {
    console.log("没有需要插入的数据");
    return;
  }

  const sqls = [];
  const params = [];

  // 构造 SQL 和参数
  data.forEach(({ daihao, model, specification, facilities, proj, company,facilities_name,facilities_loca,total_length,sysname }) => {
    sqls.push("INSERT INTO dianlan (daihao, model, specification, facilities, proj, company,facilities_name,facilities_loca,total_length,sysname,state) VALUES (?, ?, ?, ?, ?, ?, ?, ?,?,?,0)");
    params.push([daihao, model, specification, facilities, proj, company,facilities_name,facilities_loca,total_length,sysname]);
  });

  // 调用事务函数
  try {
    const results = await transaction(sqls, params);
    console.log("批量插入成功", results);
  } catch (err) {
    console.error("批量插入失败", err);
  }
}

// 主函数
async function main() {
  const filePath = `C:/Users/xyy/Desktop/1_N1454-4600TEU电缆清册.xlsx`; // 替换为实际的 Excel 文件路径
  try {
    const data = readExcel(filePath);
    console.log("读取到的数据：", data.slice(0,6));
    await insertData(data);
  } catch (err) {
    console.error("操作失败：", err);
  }
}

// 执行主函数
main();
