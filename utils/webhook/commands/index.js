const {
  sendAuthPrompt,
  handleRegisterPrompt,
  handleRegisterStep1,
  handleRegisterStep2,
  handleRegisterStep3,
  handleRegisterStep4,
  handleRegisterStep5,
  handleCancel,
  handleRegistrationConfirm,
} = require("./auth");

const { handleMenu } = require("./menu");
const { auth } = require("../authWrapper");
const {
  handleInitiateWalletGeneration,
  handleGenerateWallet,
} = require("./wallet");

const commands = [
  {
    command: "/start",
    function: sendAuthPrompt,
  },
  {
    command: "/register",
    function: handleRegisterPrompt,
  },
  {
    command: "/register:step-1",
    function: handleRegisterStep1,
  },
  {
    command: "/register:step-2",
    function: handleRegisterStep2,
  },
  {
    command: "/register:step-3",
    function: handleRegisterStep3,
  },
  {
    command: "/register:step-4",
    function: handleRegisterStep4,
  },
  {
    command: "/register:cancel",
    function: handleCancel,
  },
  {
    command: "/register:complete",
    function: handleRegistrationConfirm,
  },
  {
    command: "/wallet:initiate",
    function: auth(handleInitiateWalletGeneration),
  },
  {
    command: "/wallet:generate",
    function: auth(handleGenerateWallet),
  },
  {
    command: "/menu",
    function: auth(handleMenu),
  },
];

module.exports = {
  commands,
};
