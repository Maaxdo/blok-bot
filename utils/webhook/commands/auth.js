const { twilioClient } = require("../../../helpers/webhook/twilio");
const { BlokAxios } = require("../../../helpers/webhook/blokbot");
const { handleInitiateWalletGeneration } = require("./wallet");

async function sendAuthPrompt(user) {
  await twilioClient.messages.create({
    contentSid: "HX65bd9f6bc7ea261b5c809b1a58361d21",
    from: process.env.TWILO_FROM,
    to: `whatsapp:+${user.phone}`,
  });
  // await sendMessage(user.phone, message);
}

async function handleRegisterPrompt(user) {
  if (user.metadata) {
    await twilioClient.messages.create({
      from: process.env.TWILO_FROM,
      to: `whatsapp:+${user.phone}`,
      body: "You are already logged in.",
    });
    return;
  }

  user.state = "/register:step-1";
  await user.save();

  await twilioClient.messages.create({
    from: process.env.TWILO_FROM,
    to: `whatsapp:+${user.phone}`,
    body: "What is your first name?",
  });
}

async function handleRegisterStep1(user, message) {
  user.state = "/register:step-2";
  user.metadata = {
    firstName: message.trim(),
  };
  await user.save();

  await twilioClient.messages.create({
    from: process.env.TWILO_FROM,
    to: `whatsapp:+${user.phone}`,
    body: "What is your last name?",
  });
}

async function handleRegisterStep2(user, message) {
  user.state = "/register:step-3";
  const prevMetadata = JSON.parse(user.metadata);
  user.metadata = {
    ...prevMetadata,
    lastName: message.trim(),
  };
  await user.save();

  await twilioClient.messages.create({
    from: process.env.TWILO_FROM,
    to: `whatsapp:+${user.phone}`,
    body: "What is your email?",
  });
}

async function handleRegisterStep3(user, message) {
  user.state = "/register:step-4";
  const prevMetadata = JSON.parse(user.metadata);
  user.metadata = {
    ...prevMetadata,
    email: message.trim(),
  };
  await user.save();

  await twilioClient.messages.create({
    from: process.env.TWILO_FROM,
    to: `whatsapp:+${user.phone}`,
    body: "What password would you like to use?",
  });
}

async function handleRegisterStep4(user, message) {
  user.state = "/register:step-5";
  const prevMetadata = JSON.parse(user.metadata);
  user.metadata = {
    ...prevMetadata,
    password: message.trim(),
  };
  await user.save();

  await twilioClient.messages.create({
    from: process.env.TWILO_FROM,
    to: `whatsapp:+${user.phone}`,
    contentSid: "HX579296f5167a0d7ba5c2edfad5282e9e",
    contentVariables: JSON.stringify({
      1: user.metadata.email,
      2: user.metadata.firstName,
      3: user.metadata.lastName,
      4: user.metadata.password,
    }),
  });
}

async function handleCancel(user, message) {
  user.metadata = null;
  user.state = "/start";
  await user.save();

  await twilioClient.messages.create({
    from: process.env.TWILO_FROM,
    to: `whatsapp:+${user.phone}`,
    body: "Registration cancelled!",
  });
}

async function handleRegistrationConfirm(user, message) {
  const metadata = JSON.parse(user.metadata);

  await BlokAxios({
    url: "/register",
    method: "POST",
    data: {
      code: "string",
      phone: user.phone,
      status: "active",
      email: metadata.email,
      first_name: metadata.firstName,
      last_name: metadata.lastName,
      is_anonymous: false,
      password: metadata.password,
    },
  });

  const res = await BlokAxios({
    url: "/login",
    method: "POST",
    data: {
      email: metadata.email,
      password: metadata.password,
    },
  }).then((res) => res.data);

  user.state = "/wallet:generate";
  user.metadata = {
    token: res.access_token,
    userId: res.user_id,
  };

  await user.save();

  await twilioClient.messages.create({
    from: process.env.TWILO_FROM,
    to: `whatsapp:+${user.phone}`,
    body: "Registration completed! Welcome to Blok\nSend a 4 digit pin for your wallet to be generated.",
  });
}

module.exports = {
  sendAuthPrompt,
  handleRegisterPrompt,
  handleRegisterStep1,
  handleRegisterStep2,
  handleRegisterStep3,
  handleRegisterStep4,
  handleCancel,
  handleRegistrationConfirm,
};
