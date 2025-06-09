function truncate(string, maxLength) {
  const truncated =
    string.length > 5 ? string.substring(0, maxLength) + "..." : string;

  return truncated;
}

module.exports = { truncate };
