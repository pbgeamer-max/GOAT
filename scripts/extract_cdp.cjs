const { spawn } = require('child_process');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

async function main() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const tmpDir = path.join('C:\\Users\\Admin\\AppData\\Local\\Temp', 'chrome_cdp_' + Date.now());
  fs.mkdirSync(tmpDir, { recursive: true });

  console.log('Launching Chrome with remote debugging on port 9222...');
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    `--user-data-dir=${tmpDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    'https://store.atlasrust.com/store/'
  ]);

  // Wait 4 seconds for Chrome to start
  await new Promise(r => setTimeout(r, 4000));

  // Get WebSocket URL from http://127.0.0.1:9222/json
  console.log('Getting debugger URL...');
  const pageInfo = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const list = JSON.parse(data);
          const page = list.find(p => p.type === 'page');
          resolve(page);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });

  console.log('Found page:', pageInfo.title, pageInfo.webSocketDebuggerUrl);

  const ws = new WebSocket(pageInfo.webSocketDebuggerUrl);
  await new Promise((resolve) => ws.on('open', resolve));

  let msgId = 1;
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      const handler = (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.id === id) {
          ws.off('message', handler);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
      ws.on('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  // Navigate to Atlas store
  console.log('Navigating to https://store.atlasrust.com/store/ ...');
  await send('Page.navigate', { url: 'https://store.atlasrust.com/store/' });

  // Wait 8 seconds for Atlas store to fully load images
  console.log('Waiting for Atlas store images to load...');
  await new Promise(r => setTimeout(r, 8000));

  // Wait for images to appear
  console.log('Waiting for gem images to appear in DOM...');
  const evalResult = await send('Runtime.evaluate', {
    awaitPromise: true,
    returnByValue: true,
    expression: `
      (async () => {
        for (let attempt = 0; attempt < 30; attempt++) {
          const imgs = Array.from(document.querySelectorAll('img')).filter(img => 
            img.alt && (img.alt.includes('PayNow Image') || img.alt.includes('Fallback Image'))
          );
          if (imgs.length >= 5) {
            return imgs.map((img, i) => ({
              index: i,
              alt: img.alt,
              src: img.src,
              currentSrc: img.currentSrc
            }));
          }
          await new Promise(r => setTimeout(r, 500));
        }
        // Fallback: return all imgs
        return Array.from(document.querySelectorAll('img')).map((img, i) => ({
          index: i,
          alt: img.alt,
          src: img.src,
          currentSrc: img.currentSrc
        }));
      })()
    `
  });

  const list = evalResult.result.value;
  console.log('Extracted images count:', list.length);

  const destDir = path.join(__dirname, '..', 'public', 'images', 'gems');

  for (const item of list) {
    console.log(`[${item.index}] alt: "${item.alt}"\n  src: ${item.src}\n  currentSrc: ${item.currentSrc}`);
  }

  ws.close();
  chromeProc.kill();
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch (e) {}

  console.log('Done!');
}

main().catch(console.error);
