const { twilioClient } = require("../../../helpers/webhook/twilio");
const { BlokAxios } = require("../../../helpers/webhook/blokbot");
const { handleMenu } = require("./menu");
const { EmailSchema } = require("../../schema/auth");

async function sendAuthPrompt(user) {
  const metadata = user.metadata?.userId ? JSON.parse(user.metadata) : null;

  if (!metadata) {
    await twilioClient.messages.create({
      contentSid: "HXa0d288888b768b472b3fe7a6f509c5f5",
      from: process.env.TWILO_FROM,
      to: `whatsapp:+${user.phone}`,
    });
    return;
  }

  user.state = "/menu";
  await user.save();

  await handleMenu(user);
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

  const email = message.trim();

  const validate = EmailSchema.safeParse({ email });

  if (!validate.success) {
    await twilioClient.messages.create({
      from: process.env.TWILO_FROM,
      to: `whatsapp:+${user.phone}`,
      body: "Invalid email address provided",
    });
    return;
  }

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
    contentSid: "HX10134adbb73f43d42b4a241235ef3162",
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

async function handleViewProfile(user, message) {
  const metadata = JSON.parse(user.metadata);
  const profile = await BlokAxios({
    url: "/profile",
    params: {
      user_id: metadata.userId,
    },
  }).then((res) => res.data);

  const body = `*Profile details*\n\nPhone number: ${profile.phone}\nEmail address: ${profile.email}\nFirst name: ${profile.first_name}\nLast name: ${profile.last_name}\nStatus: ${profile.status}`;

  await twilioClient.messages.create({
    from: process.env.TWILO_FROM,
    to: `whatsapp:+${user.phone}`,
    body,
  });
}

module.exports = {
  handleViewProfile,
  sendAuthPrompt,
  handleRegisterPrompt,
  handleRegisterStep1,
  handleRegisterStep2,
  handleRegisterStep3,
  handleRegisterStep4,
  handleCancel,
  handleRegistrationConfirm,
};
