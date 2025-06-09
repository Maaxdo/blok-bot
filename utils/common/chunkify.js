function chunkify(arr, count) {
  const chunked = [];
  for (let i = 0; i < arr.length; i += count) {
    chunked.push(arr.slice(i, i + count));
  }
  return chunked;
}

module.exports = {
  chunkify,
};
