const { BlokAxios } = require("../../../helpers/webhook/blokbot");
const { twilioClient } = require("../../../helpers/webhook/twilio");

async function handleStartKyc(user, message) {
  const metadata = JSON.parse(user.metadata);

  const url = await BlokAxios({
    url: "/kyc/external-link",
    params: {
      user_id: metadata.userId,
    },
  }).then((res) => res.data.kyc_link.replace("https://", ""));

  user.state = "/kyc:confirm";
  await user.save();

  await twilioClient.messages.create({
    from: process.env.TWILO_FROM,
    to: `whatsapp:+${user.phone}`,
    contentSid: "HX393396f081b3f6b5e459027ac6894f6d",
    contentVariables: JSON.stringify({
      1: `https://${url}`,
    }),
  });
}

module.exports = {
  handleStartKyc,
};
