const xlsx = require("node-xlsx");
const fs = require("fs");
const dayjs = require("dayjs");
const inquirer = require("inquirer");
const ora = require("ora");
const cheerio = require("cheerio");
const axios = require("axios");
const path = require('path');

(async function () {
	try {
		const answer = await inquirer.prompt({
			type: "input",
			name: "id",
			message: "请输入基金代码",
		});
        const { id } = answer
		const spinner = ora('获取数据中').start();
		const url = `http://fund.eastmoney.com/${id.trim()}.html`;
		const { data } = await axios.get(url);
		const $ = cheerio.load(data);
		const title = $(".fundDetail-tit > div").children()[0].prev.data;
		const content = $(".bd .poptableWrap tr")
			.toArray()
			.slice(0, 11)
			.map((item) =>
				item.children
					.map((el) => $(el).text().trim())
					.filter((text) => text)
			);

		spinner.succeed("获取数据完成");
		const spinner2 = ora("excel 生成中").start();
		const options = {
			"!cols": [{ wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 20 }],
		};
		const now = dayjs().format(
			"YYYY-MM-DD"
        )
		const buffer = xlsx.build([{ name: now, data: content }], options);
		const filename = `${title}（${id.trim()}）${now}.xlsx`;
		const dirname = process.argv[1].startsWith('/snapshot')
			? path.dirname(process.argv[0])
			: path.dirname(process.argv[1])
		const filePath = path.join(dirname, filename.replace(/\//g,'／') .replace(/\\/g,'＼'))
		fs.writeFileSync(filePath, buffer);
		spinner2.succeed(`excel 生成成功，\n文件名：${filename}\n文件路径：${filePath}`);
	} catch (e) {
		console.error("\n发生错误");
		console.error(e);
		process.exit(1);
	}
})();