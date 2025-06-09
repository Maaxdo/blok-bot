const { WajerAxios } = require("../../../helpers/webhook/wajer");
const { sendMessage } = require("../../../helpers/webhook/whatsapp");

async function sendAuthPrompt(user) {
  const message = `
    Welcome to *STAKE IT* Whatsaapp bot. Your desired platform to bet on anything! \n
    Type */login* to login to your account \n
    Type */register* to register a new account \n
    `;

  await sendMessage(user.phone, message);
}

async function handleLoginPrompt(user) {
  if (user.apiKey) {
    await sendMessage(
      user.phone,
      "You are already logged in. Use the /menu command to view the menu.",
    );
    return;
  }

  const message = `
    Please enter your username and password in the format: "usermame password"
    E.g exampleusername ..........
    `;

  user.state = "/login:auth";
  await user.save();

  await sendMessage(user.phone, message);
}

async function handleLoginAuth(user, message) {
  try {
    const details = message.split(" ");

    const username = details[0].trim();
    const password = details[1].trim();

    const response = await WajerAxios({
      url: "/api/auth/login-user",
      method: "POST",
      data: {
        username,
        password,
      },
    }).then((res) => res.data);

    const userToken = response.token;

    user.apiKey = userToken;
    user.state = null;
    await user.save();

    await sendMessage(
      user.phone,
      "Logged in successfully! Use the /menu command to view the menu.",
    );
  } catch (err) {
    await sendMessage(
      user.phone,
      "Invalid email or password. Please try again.",
    );
  }
}

async function handleLogout(user) {
  user.apiKey = null;
  user.state = "/start";
  await user.save();

  await sendMessage(
    user.phone,
    "Logged out successfully! Use the /start command to view start commands",
  );
}

async function handleRegisterPrompt(user) {
  if (user.apiKey) {
    await sendMessage(
      user.phone,
      "You are already logged in. Use the */logout* command to logout before registering a new account.",
    );
    return;
  }

  const message = `
    Please enter your username name, email and password in the format: "username first name last name email password"
    E.g janeperson Jane Person jane@example.com password
    `;

  user.state = "/register:auth";
  await user.save();

  await sendMessage(user.phone, message);
}

async function handleRegisterAuth(user, message) {
  try {
    const details = message.split(" ");
    const username = details[0].trim();
    const firstName = details[1].trim();
    const lastName = details[2].trim();
    const email = details[3].trim();
    const password = details[4].trim();

    console.log(username, firstName, lastName, email, password);

    const response = await WajerAxios({
      url: "/api/auth/register",
      method: "POST",
      data: {
        firstname: firstName,
        lastname: lastName,
        username,
        email,
        password,
        phone: user.phone,
        phone_code: `+${user.phone.slice(0, 3)}`,
        password_confirmation: password,
      },
    }).then((res) => res.data);

    const userToken = response.token;

    user.apiKey = userToken;
    user.state = null;
    await user.save();

    await sendMessage(
      user.phone,
      "Registered in successfully! Use the /menu command to view the menu.",
    );
  } catch (err) {
    await sendMessage(user.phone, err.response.data.message);
  }
}

module.exports = {
  sendAuthPrompt,
  handleLoginPrompt,
  handleLoginAuth,
  handleLogout,
  handleRegisterPrompt,
  handleRegisterAuth,
};
