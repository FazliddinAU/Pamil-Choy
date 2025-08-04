require('dotenv').config();
const axios = require('axios');

async function downloadMedia(url) {
  const options = {
    method: 'POST',
    url: 'https://social-download-all-in-one.p.rapidapi.com/v1/social/autolink',
    headers: {
      'x-rapidapi-key': process.env.RAPID_API_KEY,
      'x-rapidapi-host': 'social-download-all-in-one.p.rapidapi.com',
      'Content-Type': 'application/json'
    },
    data: {
      url: url
    }
  };

  try {
    const response = await axios.request(options);
    return response.data;
  } catch (error) {
    console.error('❌ RapidAPI so‘rovda xatolik:', error.response?.data || error.message);
    return null;
  }
}

module.exports = downloadMedia;
