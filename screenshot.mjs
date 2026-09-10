import puppeteer from 'puppeteer-core';
import { mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';
const width = Number(process.argv[4]) || 1509;
const height = Number(process.argv[5]) || 689;
const deviceScaleFactor = Number(process.argv[6]) || 1.25;

const root = fileURLToPath(new URL('.', import.meta.url));
const outDir = join(root, 'temporary screenshots');
mkdirSync(outDir, { recursive: true });
let n = 1;
while (readdirSync(outDir).some((f) => f.startsWith(`screenshot-${n}-`) || f === `screenshot-${n}.png`)) n++;
const outPath = join(outDir, `screenshot-${n}${label ? '-' + label : ''}.png`);

const chromeDir = join(os.homedir(), '.cache', 'puppeteer', 'chrome');
const version = readdirSync(chromeDir)[0];
const executablePath = join(chromeDir, version, 'chrome-win64', 'chrome.exe');
if (!existsSync(executablePath)) throw new Error('Chrome not found at ' + executablePath);

const browser = await puppeteer.launch({ executablePath, headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width, height, deviceScaleFactor });
await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
await page.evaluate(() => document.fonts.ready);
await new Promise((r) => setTimeout(r, 300));
await page.screenshot({ path: outPath });
await browser.close();
console.log(outPath);
