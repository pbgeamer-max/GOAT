const https = require('https');
const fs = require('fs');
const path = require('path');

const images = [
  { name: 'gems_80.png', url: 'https://imagedelivery.net/X9Tw3lClLTBX0eQsukZAYA/129e9e42-c5de-4cf1-1b8f-8b92d8212900/public' },
  { name: 'gems_1200.png', url: 'https://imagedelivery.net/X9Tw3lClLTBX0eQsukZAYA/5f52d4fd-14d1-483a-8b22-05aaf3bc7400/public' },
  { name: 'gems_2500.png', url: 'https://imagedelivery.net/X9Tw3lClLTBX0eQsukZAYA/9e710b34-eb73-4426-6bdc-fa780af64c00/public' },
  { name: 'gems_5500.png', url: 'https://imagedelivery.net/X9Tw3lClLTBX0eQsukZAYA/73551af3-dd97-4ab7-ee99-9fd2b8362800/public' },
  { name: 'gems_16500.png', url: 'https://imagedelivery.net/X9Tw3lClLTBX0eQsukZAYA/d951e0ec-2d9c-4c44-f719-5949b2533400/public' },
];

const dir = 'c:\\Users\\Admin\\Desktop\\موقع سرفر راست\\public\\images\\gems';

async function download(item) {
  const dest = path.join(dir, item.name);
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(item.url, (res) => {
      res.pipe(file);
      file.on('finish', () => {
        file.close(() => {
          console.log(`Saved ${item.name} (${fs.statSync(dest).size} bytes)`);
          resolve();
        });
      });
    }).on('error', reject);
  });
}

(async () => {
  for (const item of images) {
    await download(item);
  }
  console.log('All 5 authentic Atlas gem images successfully downloaded!');
})();
