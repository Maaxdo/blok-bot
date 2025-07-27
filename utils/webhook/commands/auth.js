const { BlokAxios } = require("../../../helpers/webhook/blokbot");
const { LoginSchema, RegisterSchema } = require("../../schema/auth");
const { handleMenu } = require("./menu");
const { InfoBipAxios } = require("../../../helpers/webhook/infobip");
const { infobip } = require("../../../config/app");
const { errorParser, zodErrorParser } = require("../../common/errorParser");

async function sendAuthPrompt(user) {
  const metadata = user.metadata?.userId ? JSON.parse(user.metadata) : null;

  if (!metadata) {
    await InfoBipAxios({
      url: "/whatsapp/1/message/interactive/buttons",
      method: "POST",
      data: {
        from: infobip.phone,
        to: user.phone,
        content: {
          body: {
            text: "Hello!👋\nWelcome to Blok AI. Your fast and secure way to transact crypto.\nLet's get started.",
          },
          action: {
            buttons: [
              {
                type: "REPLY",
                id: "/register",
                title: "Create wallet",
              },
              {
                type: "REPLY",
                id: "/login",
                title: "Login",
              },
            ],
          },
          footer: {
            text: "Powered by Blok AI",
          },
        },
      },
    });
    return;
  }

  user.state = "/menu";
  await user.save();

  await handleMenu(user);
}

async function handleRegisterPrompt(user) {
  // if (user.metadata) {
  //   await InfoBipAxios({
  //     url: "/whatsapp/1/message/text",
  //     method: "POST",
  //     data: {
  //       from: infobip.phone,
  //       to: user.phone,
  //       content: {
  //         text: "You are already logged in.",
  //       },
  //     },
  //   });
  //   return;
  // }
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

    await InfoBipAxios({
      url: "/whatsapp/1/message/interactive/flow",
      method: "POST",
      data: {
        from: infobip.phone,
        to: user.phone,
        content: {
          body: {
            text: "*Sign up*🚀\n Unlock new transaction perks with Blok AI!",
          },
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
        },
      },
    });
  } catch (e) {
    await InfoBipAxios({
      url: "/whatsapp/1/message/text",
      method: "POST",
      data: {
        from: infobip.phone,
        to: user.phone,
        content: {
          text: errorParser(e),
        },
      },
    });
    return;
  }

  user.state = "/register:send-otp";
  await user.save();
}

async function handleRegisterSendOtp(user, message) {
  user.state = "/register:verify-otp";
  const validator = RegisterSchema.safeParse(message);

  if (!validator.success) {
    const error = zodErrorParser(validator);
    await InfoBipAxios({
      url: "/whatsapp/1/message/interactive/flow",
      method: "POST",
      data: {
        from: infobip.phone,
        to: user.phone,
        content: {
          body: {
            text: `*Errors* ⚠️\n${error}\n\nPlease try again`,
          },
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
        },
      },
    });
    return;
  }
  user.metadata = message;

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
    await InfoBipAxios({
      url: "/whatsapp/1/message/text",
      method: "POST",
      data: {
        from: infobip.phone,
        to: user.phone,
        content: {
          text: "An OTP has been sent to your email. Please enter it below.",
        },
      },
    });
    await user.save();
  } catch (e) {
    await InfoBipAxios({
      url: "/whatsapp/1/message/text",
      method: "POST",
      data: {
        from: infobip.phone,
        to: user.phone,
        content: {
          text: errorParser(e),
        },
      },
    });
  }
}

async function handleRegisterVerifyOtp(user, message) {
  const otp = message.trim();
  const metadata = JSON.parse(user.metadata);

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

    await InfoBipAxios({
      url: "/whatsapp/1/message/interactive/buttons",
      method: "POST",
      data: {
        from: infobip.phone,
        to: user.phone,
        content: {
          body: {
            text: "Hurray!🎉\nRegistration successful!. Set up your wallet",
          },
          action: {
            buttons: [
              {
                type: "REPLY",
                id: "/wallet:initiate",
                title: "Create wallet",
              },
            ],
          },
        },
      },
    });
    user.state = "/kyc";
    await user.save();
  } catch (e) {
    await InfoBipAxios({
      url: "/whatsapp/1/message/text",
      method: "POST",
      data: {
        from: infobip.phone,
        to: user.phone,
        content: {
          text: `*An error occured* ⚠️\n${errorParser(e)}\nPlease try again.`,
        },
      },
    });
  }
}

async function handleCancel(user, message) {
  user.metadata = null;
  user.state = "/start";
  await user.save();

  await InfoBipAxios({
    url: "/whatsapp/1/message/text",
    method: "POST",
    data: {
      from: infobip.phone,
      to: user.phone,
      content: {
        text: "Registration cancelled",
      },
    },
  });
}

async function handleRegistrationConfirm(user, message) {
  const metadata = JSON.parse(user.metadata);

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
  await InfoBipAxios({
    url: "/whatsapp/1/message/text",
    method: "POST",
    data: {
      from: infobip.phone,
      to: user.phone,
      content: {
        text: "Registration successful!\nType in a 4 digit pin to generate your wallet.",
      },
    },
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

  await InfoBipAxios({
    url: "/whatsapp/1/message/text",
    method: "POST",
    data: {
      from: infobip.phone,
      to: user.phone,
      content: {
        text: body,
      },
    },
  });
}

async function handleLogin(user, message) {
  user.state = "/login:confirm";
  await user.save();
  await InfoBipAxios({
    url: "/whatsapp/1/message/interactive/flow",
    method: "POST",
    data: {
      from: infobip.phone,
      to: user.phone,
      content: {
        body: {
          text: "Sign In\nWelcome to Blok AI. Your fast and secure way to transact crypto.\nLet's get started.",
        },
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
      },
    },
  });
}

async function handleLoginConfirm(user, message) {
  try {
    const validator = LoginSchema.safeParse(message);
    if (!validator.success) {
      const error = zodErrorParser(validator);
      await InfoBipAxios({
        url: "/whatsapp/1/message/interactive/flow",
        method: "POST",
        data: {
          from: infobip.phone,
          to: user.phone,
          content: {
            body: {
              text: `*Errors* ⚠️\n${error}\n\nPlease try again`,
            },
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
    await InfoBipAxios({
      url: "/whatsapp/1/message/interactive/buttons",
      method: "POST",
      data: {
        from: infobip.phone,
        to: user.phone,
        content: {
          body: {
            text: "Login successful!. View the available options",
          },
          action: {
            buttons: [
              {
                type: "REPLY",
                id: "/menu",
                title: "View Menu",
              },
            ],
          },
        },
      },
    });
  } catch (e) {
    await InfoBipAxios({
      url: "/whatsapp/1/message/interactive/flow",
      method: "POST",
      data: {
        from: infobip.phone,
        to: user.phone,
        content: {
          body: {
            text: `${errorParser(e)}\nPlease try again`,
          },
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
        },
      },
    });
  }
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
};
