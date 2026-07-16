const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const fflate = require("fflate");
const { DOMParser } = require("linkedom");

const source = fs.readFileSync("app.js", "utf8");
const start = source.indexOf("function decodeBillBuffer");
const end = source.indexOf("function renderFinance", start);
assert.ok(start >= 0 && end > start, "finance import helpers should exist");

const context = {
  TextDecoder,
  Date,
  Number,
  String,
  crypto: require("node:crypto").webcrypto,
  DOMParser,
  fflate,
};
vm.createContext(context);
vm.runInContext(`${source.slice(start, end)}\nthis.api = { parseDelimitedBill, parseXlsxBill, billRowsToTransactions, guessFinanceCategory, isSavingTransfer };`, context);

const wechatCsv = [
  "微信支付账单明细,,,,,,,,,,",
  "交易时间,交易类型,交易对方,商品,收/支,金额(元),支付方式,当前状态,交易单号,商户单号,备注",
  "2026-07-14 12:30:00,商户消费,某某餐厅,午饭,支出,¥25.50,零钱,支付成功,42001,,",
  "2026-07-14 15:00:00,二维码收款,朋友,转账,收入,10.00,零钱,已收钱,42002,,",
  "2026-07-14 16:00:00,商户消费,无效订单,测试,支出,2.00,零钱,支付失败,42003,,",
  "2026-07-14 17:00:00,转账,招商银行储蓄卡,每月存款,不计收支,500.00,零钱,支付成功,42004,,",
].join("\r\n");

const result = context.api.billRowsToTransactions(context.api.parseDelimitedBill(wechatCsv), "微信账单.csv");
assert.equal(result.platform, "微信");
assert.equal(result.imported.length, 3);
assert.equal(result.skipped, 1);
assert.equal(result.imported[0].amount, 25.5);
assert.equal(result.imported[0].type, "expense");
assert.equal(result.imported[0].category, "餐饮");
assert.equal(result.imported[1].type, "income");
assert.equal(result.imported[1].category, "收入");
assert.equal(result.imported[0].importKey, "微信:42001");
assert.equal(result.imported[2].type, "saving");
assert.equal(result.imported[2].category, "存钱");
assert.equal(result.imported[2].amount, 500);

const encoder = new TextEncoder();
const workbook = fflate.zipSync({
  "[Content_Types].xml": encoder.encode('<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>'),
  "xl/worksheets/sheet1.xml": encoder.encode('<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>微信支付账单明细</t></is></c></row><row r="2"><c r="A2" t="inlineStr"><is><t>交易时间</t></is></c><c r="B2" t="inlineStr"><is><t>交易对方</t></is></c><c r="C2" t="inlineStr"><is><t>商品</t></is></c><c r="D2" t="inlineStr"><is><t>收/支</t></is></c><c r="E2" t="inlineStr"><is><t>金额(元)</t></is></c><c r="F2" t="inlineStr"><is><t>当前状态</t></is></c><c r="G2" t="inlineStr"><is><t>交易单号</t></is></c></row><row r="3"><c r="A3" t="inlineStr"><is><t>2026-07-15 12:00:00</t></is></c><c r="B3" t="inlineStr"><is><t>测试餐厅</t></is></c><c r="C3" t="inlineStr"><is><t>午餐</t></is></c><c r="D3" t="inlineStr"><is><t>支出</t></is></c><c r="E3"><v>18.50</v></c><c r="F3" t="inlineStr"><is><t>支付成功</t></is></c><c r="G3" t="inlineStr"><is><t>xlsx-001</t></is></c></row></sheetData></worksheet>'),
});
const xlsxRows = context.api.parseXlsxBill(workbook.buffer);
const xlsxResult = context.api.billRowsToTransactions(xlsxRows, "微信账单.xlsx");
assert.equal(xlsxRows.length, 3);
assert.equal(xlsxResult.imported.length, 1);
assert.equal(xlsxResult.imported[0].amount, 18.5);
assert.equal(xlsxResult.imported[0].category, "餐饮");
assert.equal(xlsxResult.imported[0].importKey, "微信:xlsx-001");

assert.equal(context.api.guessFinanceCategory("美团 · 外卖订单"), "餐饮");
assert.equal(context.api.guessFinanceCategory("京东商城 · 日用品"), "购物");
assert.equal(context.api.guessFinanceCategory("上海米哈游网络科技股份有限公司"), "游戏");
assert.equal(context.api.guessFinanceCategory("某某科技有限公司 · 游戏点券充值"), "游戏");
assert.equal(context.api.guessFinanceCategory("某某科技有限公司 · 软件服务"), "其他");
assert.equal(context.api.guessFinanceCategory("深圳市腾讯计算机系统有限公司 · 300长鸣珠"), "游戏");
assert.equal(context.api.guessFinanceCategory("深圳市腾讯计算机系统有限公司 · 笺叶裁香"), "游戏");
assert.equal(context.api.guessFinanceCategory("杭州网易雷火科技有限公司 · 6枚魂玉"), "游戏");
assert.equal(context.api.isSavingTransfer("转账到招商银行储蓄卡"), true);
assert.equal(context.api.isSavingTransfer("招行 · 每月存款"), true);
assert.equal(context.api.isSavingTransfer("招商银行信用卡还款"), false);
assert.equal(context.api.isSavingTransfer("招商银行 · 商户消费"), false);

console.log("finance CSV/XLSX import parser: ok");
