// youtubeDownloader.js (to'liq, xatosiz variant)

const YTDlpWrap = require('yt-dlp-wrap').default;
const { HttpsProxyAgent } = require('https-proxy-agent');
const path = require('path');
const os = require('os');
const fs = require('fs');

const binaryPath = path.join(__dirname, 'node_modules/yt-dlp-wrap/bin/yt-dlp_linux');
// Agar yuqoridagi build command bilan yuklagan bo'lsangiz: path.join(__dirname, 'yt-dlp')

const ytDlp = new YTDlpWrap(binaryPath);

const proxyList = [
  'http://103.174.102.183:80',
  'http://47.251.43.115:33333',
  // ... qo'shimcha proxy'lar
];

let currentProxyIndex = 0;

function getNextProxy() {
  if (proxyList.length === 0) return null;
  const proxy = proxyList[currentProxyIndex];
  currentProxyIndex = (currentProxyIndex + 1) % proxyList.length;
  console.log(`Proxy: ${proxy}`);
  return proxy;
}

async function getYouTubeMedia(url) {
  try {
    const proxy = getNextProxy();
    const options = proxy ? { proxy } : {};

    const info = await ytDlp.getVideoInfo(url, options);

    const format = info.formats
      .filter(f => f.vcodec !== 'none' && f.acodec !== 'none')
      .sort((a, b) => (b.filesize || 0) - (a.filesize || 0))[0] || info.formats[0];

    return {
      medias: [{ url: format.url, quality: format.format_note || 'best' }],
      title: info.title,
      thumbnail: info.thumbnail
    };
  } catch (err) {
    console.error('yt-dlp xatosi:', err);
    return { error: err.message };
  }
}

// downloadYouTubeVideo funksiyasini ham shu tarzda yangilang (args ga --proxy qo'shing)
async function downloadYouTubeVideo(url) {
  const fileName = `yt_${Date.now()}.mp4`;
  const filePath = path.join(os.tmpdir(), fileName);

  try {
    const proxy = getNextProxy();
    const args = [
      url,
      '-f', 'bestvideo+bestaudio/best',
      '--merge-output-format', 'mp4',
      '-o', filePath
    ];

    if (proxy) args.unshift('--proxy', proxy);

    await ytDlp.execPromise(args);
    return filePath;
  } catch (err) {
    console.error(err);
    return null;
  }
}

module.exports = { getYouTubeMedia, downloadYouTubeVideo };
