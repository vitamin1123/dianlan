const XLSX = require('xlsx');
const path = require('path');
const { transaction } = require('./db/mysql_trans_110'); // 替换为实际的文件路径

// 读取 Excel 并提取型号和金额
function readExcel(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  // 获取工作表的有效范围
  const range = XLSX.utils.decode_range(sheet['!ref']); // 获取 Excel 的有效范围
  const startRow = 3;  // 从第四行开始读取

  // 设置 range 的开始行，保证读取从第四行开始的数据
  range.s.r = startRow; // 设置起始行（0-based）
  sheet['!ref'] = XLSX.utils.encode_range(range); // 更新范围

  // 将表格数据转换为 JSON 格式
  const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // 提取型号和金额数据
  const data = [];
  for (let i = 0; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (row[0] && row[1]) { // 确保型号和金额不为空
      data.push({ model: row[0], price: parseAmount(row[1]) });
    }
  }
  return data;
}

// 转换金额字符串为数字
function parseAmount(amountStr) {
  const cleanAmount = amountStr.replace(/[^0-9.-]+/g, "");
  const amount = parseFloat(cleanAmount);
  if (!isNaN(amount)) return amount;
  throw new Error(`Invalid amount format: ${amountStr}`);
}

// 批量插入数据
async function insertData(data) {
  if (!data.length) {
    console.log("没有需要插入的数据");
    return;
  }

  const sqls = [];
  const params = [];

  // 构造 SQL 和参数
  data.forEach(({ model, price }) => {
    sqls.push("INSERT INTO baseprice (model, price) VALUES (?, ?)");
    params.push([model, price]);
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
//   const filePath = path.join(__dirname, 'your-excel-file.xlsx'); // 替换为实际的 Excel 文件路径
  const filePath = `/Users/xyy/Desktop/副本接线产值价目表.xlsx`// 替换为你的文件路径
  try {
    const data = readExcel(filePath);
    console.log("读取到的数据：", data);
    await insertData(data);
  } catch (err) {
    console.error("操作失败：", err);
  }
}

// 执行主函数
main();
