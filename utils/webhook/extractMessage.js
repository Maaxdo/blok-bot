function extractMessage(body) {
  const content = body.results[0].content[0];

  if (content.type === "TEXT") {
    return content.text;
  }

  if (content.type === "BUTTON_REPLY") {
    return content.id;
  }

  if (content.type === "FLOW_RESPONSE") {
    return content.response;
  }

  return "";
}

module.exports = {
  extractMessage,
};
