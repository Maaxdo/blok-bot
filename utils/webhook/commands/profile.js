const {
  sendFlow,
  sendText,
  sendInteractiveButtons,
} = require("../../../helpers/bot/infobip");
const {
  refreshCommandExpiry,
  removeCommandExpiry,
} = require("../../common/expiry");
const { zodErrorParser, errorParser } = require("../../common/errorParser");
const { ProfileSchema } = require("../../schema/profile");
const { BlokAxios } = require("../../../helpers/webhook/blokbot");

const profileAction = {
  mode: "PUBLISHED",
  flowMessageVersion: 3,
  flowToken: "Flow token",
  flowId: "1337689353982845",
  callToActionButton: "Continue",
  flowAction: "NAVIGATE",
  flowActionPayload: {
    screen: "PROFILE_SCREEN",
  },
};

async function handleUpdateProfile(user, message) {
  await refreshCommandExpiry(user, "/profile:update", 20);
  user.rememberedState = "/profile:update";
  user.state = "/profile:update:details";
  await user.save();
  await sendFlow({
    user,
    text: "📝 Please update your profile information using the form below",
    action: profileAction,
  });
}

async function handleUpdateProfileDetails(user, message) {
  const validator = ProfileSchema.safeParse(message);

  if (!validator.success) {
    const errorMessage = zodErrorParser(validator);
    await sendFlow({
      user,
      text: `❌ There were errors with the information provided:\n\n${errorMessage}\n\nPlease try again.`,
      action: profileAction,
    });
    return;
  }

  try {
    const { firstName, lastName, phone } = validator.data;
    await BlokAxios({
      url: "/profile",
      params: {
        user_id: user.metadata.userId,
      },
      method: "PUT",
      data: {
        first_name: firstName,
        last_name: lastName,
        phone,
      },
    });

    user.rememberedState = null;
    user.state = "/menu";
    await removeCommandExpiry(user);
    await user.save();

    await sendInteractiveButtons({
      user,
      text: "✅ Your profile has been updated successfully.",
      buttons: [
        {
          type: "REPLY",
          id: "/menu",
          title: "Return to Menu",
        },
        {
          type: "REPLY",
          id: "/profile",
          title: "View Profile",
        },
      ],
    });
  } catch (err) {
    await sendText({
      user,
      text: `❌ An error occurred while updating your profile.\n${errorParser(err)}`,
    });
    return;
  }
}

module.exports = {
  handleUpdateProfile,
  handleUpdateProfileDetails,
};
