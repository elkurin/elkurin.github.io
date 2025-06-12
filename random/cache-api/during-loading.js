// const modelFileNameRemote = 'https://storage.googleapis.com/jmstore/WebAIDemos/models/Gemma2/gemma2-2b-it-gpu-int8.bin';

const modelFileNameRemote = './index.js'

async function fetchAndCacheFile(url) {
  console.log('Fetch and caching: ', url);
  const MODEL_CACHE = await caches.open('models');
  response = await MODEL_CACHE.match(url);
  console.log("cached response", response);
  if (response) {
  console.log("using cached response");
    return response;
  }
  console.log("adding to cache");
  await MODEL_CACHE.add(url);
  console.log("now using that");
  return await MODEL_CACHE.match(url);
3};

async function initLLM() {
  let startTs = new Date();
  let data = await fetchAndCacheFile(modelFileNameRemote);
  let fetchTs = new Date()
  console.log("fetch", fetchTs - startTs);
  let len = 0;
  for await (const chunk of data.body) {
    len += chunk.length;
  }
  let finalTs = new Date()
  console.log("body", finalTs - fetchTs);
  console.log("len", len);
}

if (location.hash == "#init") {
    initLLM();
}

