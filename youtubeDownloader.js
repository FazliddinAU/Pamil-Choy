// youtubeDownloader.js (to'liq yangilangan versiya)

const YTDlpWrap = require('yt-dlp-wrap').default;
const { HttpsProxyAgent } = require('https-proxy-agent');
const path = require('path');
const os = require('os');
const fs = require('fs');

const ytDlp = new YTDlpWrap();  // binary avto yuklanadi

// BEPUL PROXY misollari (2026-fevral holatida sinab ko'ring, tez o'zgaradi!)
const proxyList = [
  'http://103.174.102.183:80',
  'http://47.251.43.115:33333',
  'http://47.251.70.153:33333',
  'http://154.65.39.7:80',
  'http://190.103.177.131:80',
  // Qo'shimcha bepul proxy'lar uchun: https://proxyscrape.com/free-proxy-list dan oling
  // yoki https://raw.githubusercontent.com/Skillter/ProxyGather/master/proxies/working-proxies-all.txt
];

let currentProxyIndex = 0;

function getNextProxy() {
  if (proxyList.length === 0) return null;
  const proxyUrl = proxyList[currentProxyIndex];
  currentProxyIndex = (currentProxyIndex + 1) % proxyList.length;
  console.log(`Foydalanilayotgan proxy: ${proxyUrl}`);
  return proxyUrl;
}

async function getYouTubeMedia(url) {
  try {
    const proxyUrl = getNextProxy();
    let options = {};

    if (proxyUrl) {
      const agent = new HttpsProxyAgent(proxyUrl);
      // yt-dlp --proxy http://ip:port formatida ishlaydi
      options = { proxy: proxyUrl };  // yt-dlp-wrap proxy ni shu tarzda qabul qiladi (ba'zi versiyalarda)
      // Agar yuqoridagi ishlamasa, quyidagicha qo'lda qo'shing:
      // ytDlp.setProxy(proxyUrl);   // agar metod mavjud bo'lsa
    }

    const info = await ytDlp.getVideoInfo(url, options);

    const format = info.formats
      .filter(f => f.vcodec !== 'none' && f.acodec !== 'none')
      .sort((a, b) => (b.filesize || 0) - (a.filesize || 0))[0] || info.formats[0];

    return {
      medias: [{
        url: format.url,
        quality: format.format_note || format.quality || 'best',
        mimeType: format.mimeType || 'video/mp4'
      }],
      title: info.title,
      thumbnail: info.thumbnail
    };
  } catch (err) {
    console.error('yt-dlp xatosi:', err.message);
    return { error: err.message || 'Yuklab bo\'lmadi (proxy sinab ko\'ring)' };
  }
}

async function downloadYouTubeVideo(url) {
  const fileName = `yt_${Date.now()}.mp4`;
  const filePath = path.join(os.tmpdir(), fileName);

  try {
    const proxyUrl = getNextProxy();
    let args = [
      url,
      '-f', 'bestvideo+bestaudio/best',
      '--merge-output-format', 'mp4',
      '-o', filePath
    ];

    if (proxyUrl) {
      args.unshift('--proxy', proxyUrl);  // yt-dlp --proxy http://ip:port
    }

    await ytDlp.execPromise(args);
    return filePath;
  } catch (err) {
    console.error('Download xatosi:', err);
    return null;
  }
}

module.exports = { getYouTubeMedia, downloadYouTubeVideo };
