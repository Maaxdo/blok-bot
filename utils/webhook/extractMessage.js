function extractMessage(body) {
  if ("ButtonPayload" in body) {
    return body.ButtonPayload;
  }

  return body.Body;
}

module.exports = {
  extractMessage,
};
