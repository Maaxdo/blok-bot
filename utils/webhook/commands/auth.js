const { BlokAxios } = require("../../../helpers/webhook/blokbot");
const {
  LoginSchema,
  RegisterSchema,
  ResetPasswordSchema,
  EmailSchema,
} = require("../../schema/auth");
const { handleMenu } = require("./menu");
const { errorParser, zodErrorParser } = require("../../common/errorParser");
const {
  sendInteractiveButtons,
  sendText,
  sendFlow,
} = require("../../../helpers/bot/infobip");
const {
  refreshCommandExpiry,
  removeCommandExpiry,
} = require("../../common/expiry");
const { logger } = require("../../common/logger");

async function sendAuthPrompt(user) {
  const metadata = user.metadata?.userId ? user.metadata : null;

  if (!metadata) {
    await sendInteractiveButtons({
      user,
      text: "👋 Welcome to Blok AI\nYour fast and secure way to manage and transact crypto.\n",
      buttons: [
        {
          type: "REPLY",
          id: "/register",
          title: "Create an account",
        },
        {
          type: "REPLY",
          id: "/login",
          title: "Login",
        },
      ],
    });
    return;
  }

  user.state = "/menu";
  await user.save();

  await handleMenu(user);
}

async function handleRegisterPrompt(user) {
  const currentState = user.state;

  try {
    await BlokAxios({
      url: "/signup/phone",
      method: "POST",
      data: {
        phone_number: user.phone,
      },
    });
    user.state = "/phone-verify";
    await user.save();

    await BlokAxios({
      url: "/signup/phone/verify",
      method: "POST",
      data: {
        phone_number: user.phone,
        code: "012345",
      },
    });
    user.state = currentState;
    await user.save();
    await sendFlow({
      user,
      text: "*Sign up*🚀\n Unlock new transaction perks with Blok AI!",
      action: {
        mode: "PUBLISHED",
        flowMessageVersion: 3,
        flowToken: "Flow token",
        flowId: "24693814993544868",
        callToActionButton: "Continue",
        flowAction: "NAVIGATE",
        flowActionPayload: {
          screen: "SIGNUP_SCREEN",
        },
      },
    });
    await refreshCommandExpiry(user, "/register", 20);
  } catch (e) {
    logger.error(errorParser(e), e);
    await sendText({
      user,
      text: errorParser(e),
    });
    return;
  }

  user.state = "/register:send-otp";
  await user.save();
}

async function handleRegisterSendOtp(user, message) {
  const validator = RegisterSchema.safeParse(message);

  if (!validator.success) {
    const error = zodErrorParser(validator);
    await sendFlow({
      user,
      text: `*Errors* ⚠️\n${error}\n\nPlease try again`,
      action: {
        mode: "PUBLISHED",
        flowMessageVersion: 3,
        flowToken: "Flow token",
        flowId: "24693814993544868",
        callToActionButton: "Continue",
        flowAction: "NAVIGATE",
        flowActionPayload: {
          screen: "SIGNUP_SCREEN",
        },
      },
    });
    return;
  }

  try {
    await BlokAxios({
      url: "/signup/email",
      method: "POST",
      data: {
        request: {
          email: message.email,
        },
        phone: user.phone,
      },
    });
    user.state = "/register:verify-otp";
    user.metadata = message;
    await user.save();
    await sendText({
      user,
      text: "An OTP has been sent to your email. Please enter it below.",
    });
  } catch (e) {
    await sendText({
      user,
      text: errorParser(e),
    });
    logger.error(errorParser(e), e);
  }
}

async function handleRegisterVerifyOtp(user, message) {
  const otp = message.trim();
  const metadata = user.metadata;

  try {
    await BlokAxios({
      url: "/signup/email/verify",
      method: "POST",
      data: {
        email: metadata.email,
        code: otp,
        phone: user.phone,
      },
    });
    await BlokAxios({
      url: "/signup/details",
      method: "POST",
      data: {
        phone: user.phone,
        first_name: metadata.firstName,
        last_name: metadata.lastName,
        email: metadata.email,
        password: metadata.password,
        dob: metadata.dob,
        gender: "string",
        is_mobile_app: false,
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

    user.metadata = {
      token: res.access_token,
      userId: res.user_id,
    };

    await sendInteractiveButtons({
      user,
      text: "Hurray!🎉\nRegistration successful!. Set up your wallet",
      buttons: [
        {
          type: "REPLY",
          id: "/wallet:initiate",
          title: "Create wallet",
        },
      ],
    });

    user.state = "/kyc";
    await user.save();
  } catch (e) {
    await sendText({
      user,
      text: `*An error occured* ⚠️\n${errorParser(e)}\nPlease try again.`,
    });
    logger.error(errorParser(e), e);
  }
}

async function handleCancel(user, message) {
  user.metadata = null;
  user.state = "/start";
  await user.save();
  await sendText({
    user,
    text: "Registration cancelled",
  });
}

async function handleRegistrationConfirm(user, message) {
  try {
    const metadata = user.metadata;
    const validator = RegisterSchema.safeParse(message);

    if (!validator.success) {
      sendText({
        user,
        text: `⚠ Invalid details provided. ${validator.error.message}`,
      });
      return;
    }

    await BlokAxios({
      url: "/signup/details",
      method: "POST",
      data: {
        phone: user.phone,
        first_name: metadata.firstName,
        last_name: metadata.lastName,
        email: metadata.email,
        password: metadata.password,
        dob: metadata.dob,
        gender: "string",
        is_mobile_app: false,
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
    await sendText({
      user,
      text: "Registration successful!\nType in a 4 digit pin to generate your wallet.",
    });
    await removeCommandExpiry(user);
  } catch (e) {
    logger.error(errorParser(e), e);
    await sendText({
      user,
      text: "An error occurred. Please try again",
    });
  }
}

async function handleResetPassword(user, message) {
  user.state = "/reset-password:email";
  await user.save();
  user.rememberedState = "/reset-password";
  await refreshCommandExpiry(user, "/reset-password", 20);
  await sendText({
    user,
    text: "🔑 Reset Password\nPlease reply with your email address to start the password reset process.\n\n📩 We’ll send you a secure code to create a new password and regain access to your account.",
  });
}

async function handleResetPasswordEmail(user, message) {
  const metadata = user.metadata;
  const email = message.trim();
  const validator = EmailSchema.safeParse({
    email,
  });

  if (!validator.success) {
    await sendText({
      user,
      text: "Invalid email provided. Please try again",
    });
    return;
  }

  try {
    user.state = "/reset-password:code";
    user.metadata = {
      ...metadata,
      email,
    };
    await user.save();
    await BlokAxios({
      method: "POST",
      url: "/request-reset-code",
      data: {
        email,
      },
    });
    await sendFlow({
      user,
      text: "📩 Password Reset Code Sent\nWe’ve sent a reset code to your registered email address.\n\n✍ When you receive the code, please enter it in the form below to verify and reset your password.",
      action: {
        mode: "PUBLISHED",
        flowMessageVersion: 3,
        flowToken: "Flow token",
        flowId: "798738512600008",
        callToActionButton: "Continue",
        flowAction: "NAVIGATE",
        flowActionPayload: {
          screen: "RESET_SCREEN",
        },
      },
    });
  } catch (e) {
    await sendText({
      user,
      text: `An error occurred.\n${errorParser(e)}`,
    });
  }
}

async function handleResetPasswordCode(user, message) {
  const validator = ResetPasswordSchema.safeParse(message);

  if (!validator.success) {
    await sendFlow({
      user,
      text: `⚠️ Invalid details provided.\n${zodErrorParser(validator)}`,
      action: {
        mode: "PUBLISHED",
        flowMessageVersion: 3,
        flowToken: "Flow token",
        flowId: "798738512600008",
        callToActionButton: "Continue",
        flowAction: "NAVIGATE",
        flowActionPayload: {
          screen: "RESET_SCREEN",
        },
      },
    });
    return;
  }

  try {
    await BlokAxios({
      url: "/reset-password",
      method: "POST",
      data: {
        email: user.metadata.email,
        reset_code: message.resetCode,
        new_password: message.password,
      },
    });
    await sendInteractiveButtons({
      user,
      text: "✅ Password Reset Successful\nYour password has been updated securely.\n\n🔐 Please log in with your new password to continue",
      buttons: [
        {
          type: "REPLY",
          id: "/login",
          title: "Login",
        },
      ],
    });
    await removeCommandExpiry(user);
    user.state = "/start";
    await user.save();
  } catch (e) {
    await sendText({
      user,
      text: `An error occurred.\n${errorParser(e)}`,
    });
  }
}

async function handleViewProfile(user, message) {
  try {
    const metadata = user.metadata;
    const profile = await BlokAxios({
      url: "/profile",
      params: {
        user_id: metadata.userId,
      },
    }).then((res) => res.data);

    const body = `*Profile details*\n\nPhone number: ${profile.phone}\nEmail address: ${profile.email}\nFirst name: ${profile.first_name}\nLast name: ${profile.last_name}\nStatus: ${profile.status.replaceAll("_", " ").toUpperCase()}`;

    await sendText({
      user,
      text: body,
    });
  } catch (e) {
    await sendText({
      user,
      text: `An error occurred.\n${errorParser(e)}`,
    });
  }
}

async function handleLogin(user, message) {
  user.state = "/login:confirm";
  await user.save();
  await sendFlow({
    user,
    text: "🔐 Sign in to continue\nAccess your assets, track transactions, and stay updated with live rates",
    action: {
      mode: "PUBLISHED",
      flowMessageVersion: 3,
      flowToken: "Flow token",
      flowId: "1848452559046569",
      callToActionButton: "Continue",
      flowAction: "NAVIGATE",
      flowActionPayload: {
        screen: "SIGNIN_SCREEN",
      },
    },
  });
  await sendInteractiveButtons({
    user,
    text: "🔑 Forgot your password?\nNo worries, you can reset it securely.\n\n👇 Click the button below to set a new password and regain access to your account.\n",
    buttons: [
      {
        type: "REPLY",
        id: "/reset-password",
        title: "Reset Password",
      },
    ],
  });
  await refreshCommandExpiry(user, "/login", 20);
}

async function handleLoginConfirm(user, message) {
  try {
    const validator = LoginSchema.safeParse(message);
    if (!validator.success) {
      const error = zodErrorParser(validator);
      await sendFlow({
        user,
        text: `*Errors* ⚠️\n${error}\n\nPlease try again`,
        action: {
          mode: "PUBLISHED",
          flowMessageVersion: 3,
          flowToken: "Flow token",
          flowId: "1848452559046569",
          callToActionButton: "Continue",
          flowAction: "NAVIGATE",
          flowActionPayload: {
            screen: "SIGNIN_SCREEN",
          },
        },
      });
      return;
    }

    const res = await BlokAxios({
      url: "/login",
      method: "POST",
      data: {
        email: message.email,
        password: message.password,
      },
    }).then((res) => res.data);
    user.state = "/menu";
    user.metadata = {
      token: res.access_token,
      userId: res.user_id,
    };
    await user.save();
    await sendInteractiveButtons({
      user,
      text: "✅ Login Successful\nWelcome back! You’re now signed in to Blok AI.\n\n👉 To continue, type /menu or click the button below to view all available options.",
      buttons: [
        {
          type: "REPLY",
          id: "/menu",
          title: "View Menu",
        },
      ],
    });
    await removeCommandExpiry(user);
  } catch (e) {
    await sendFlow({
      user,
      text: `${errorParser(e)}\nPlease try again`,
      action: {
        mode: "PUBLISHED",
        flowMessageVersion: 3,
        flowToken: "Flow token",
        flowId: "1848452559046569",
        callToActionButton: "Continue",
        flowAction: "NAVIGATE",
        flowActionPayload: {
          screen: "SIGNIN_SCREEN",
        },
      },
    });
  }
}

async function handleLogout(user) {
  await sendInteractiveButtons({
    user,
    text: "⬅️ Are you sure you want to logout?",
    buttons: [
      {
        type: "REPLY",
        id: "/logout:confirm",
        title: "Yes",
      },
      {
        type: "REPLY",
        id: "/logout:cancel",
        title: "No",
      },
    ],
  });
  await refreshCommandExpiry(user, "/logout", 20);
}

async function handleLogoutConfirm(user, message) {
  user.metadata = null;
  user.state = "/start";
  await user.save();
  await sendAuthPrompt(user);
  await removeCommandExpiry(user);
}

async function handleLogoutCancel(user, message) {
  user.state = "/menu";
  await user.save();
  await sendText({ user, text: "Logout cancelled" });
}

module.exports = {
  handleViewProfile,
  sendAuthPrompt,
  handleRegisterPrompt,
  handleCancel,
  handleRegistrationConfirm,
  handleLogin,
  handleLoginConfirm,
  handleRegisterSendOtp,
  handleRegisterVerifyOtp,
  handleLogout,
  handleLogoutConfirm,
  handleLogoutCancel,
  handleResetPassword,
  handleResetPasswordEmail,
  handleResetPasswordCode,
};
