function truncate(string, maxLength) {
  return string.length > 5 ? string.substring(0, maxLength) + "..." : string;
}

module.exports = { truncate };
