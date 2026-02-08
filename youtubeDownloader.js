const ytdl = require('@distube/ytdl-core');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function getYouTubeMedia(url) {
  if (!ytdl.validateURL(url)) {
    return { error: 'Noto\'g\'ri YouTube URL' };
  }

  try {
    const info = await ytdl.getInfo(url);

    // Eng yaxshi video + audio birga (ko'pincha 720p yoki yuqori)
    let format = ytdl.chooseFormat(info.formats, {
      filter: 'audioandvideo',
      quality: 'highestvideo'
    });

    if (!format) {
      format = ytdl.chooseFormat(info.formats, { quality: 'highest' });
    }

    if (!format) {
      return { error: 'Mos format topilmadi' };
    }

    return {
      medias: [{
        url: format.url,
        quality: format.qualityLabel || format.quality || 'best'
      }],
      title: info.videoDetails.title,
      thumbnail: info.videoDetails.thumbnails?.[0]?.url || ''
    };
  } catch (err) {
    console.error('ytdl xatosi:', err.message);
    return { error: 'Yuklab bo\'lmadi (video cheklangan bo\'lishi mumkin)' };
  }
}

async function downloadYouTubeVideo(url) {
  const fileName = `yt_${Date.now()}.mp4`;
  const filePath = path.join(os.tmpdir(), fileName);

  try {
    const info = await ytdl.getInfo(url);
    const format = ytdl.chooseFormat(info.formats, {
      filter: 'audioandvideo',
      quality: 'highest'
    });

    if (!format) throw new Error('Format topilmadi');

    const stream = ytdl.downloadFromInfo(info, { format });
    stream.pipe(fs.createWriteStream(filePath));

    await new Promise((resolve, reject) => {
      stream.on('end', resolve);
      stream.on('error', reject);
    });

    return filePath;
  } catch (err) {
    console.error(err);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    return null;
  }
}

module.exports = { getYouTubeMedia, downloadYouTubeVideo };
