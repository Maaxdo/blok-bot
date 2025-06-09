function extractMessage(message) {
  if (message.type === "text") {
    return message.text.body;
  }

  if (message.type === "interactive") {
    return message.interactive.list_reply.id;
  }
}

module.exports = {
  extractMessage,
};
