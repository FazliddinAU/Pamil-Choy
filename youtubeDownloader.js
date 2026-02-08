const YTDlpWrap = require('yt-dlp-wrap');
const path = require('path');
const os = require('os');
const fs = require('fs');

const ytDlp = new YTDlpWrap();  // binary avto yuklanadi

async function getYouTubeMedia(url) {
  try {
    const info = await ytDlp.getVideoInfo(url);
    
    // Eng yaxshi video + audio birga (bestvideo+bestaudio)
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
    return { error: err.message || 'Yuklab bo\'lmadi' };
  }
}

async function downloadYouTubeVideo(url) {
  const fileName = `yt_${Date.now()}.mp4`;
  const filePath = path.join(os.tmpdir(), fileName);

  try {
    await ytDlp.execPromise([
      url,
      '-f', 'bestvideo+bestaudio/best',
      '--merge-output-format', 'mp4',
      '-o', filePath
    ]);
    return filePath;
  } catch (err) {
    console.error(err);
    return null;
  }
}

module.exports = { getYouTubeMedia, downloadYouTubeVideo };
