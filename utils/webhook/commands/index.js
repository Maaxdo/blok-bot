const {
  sendAuthPrompt,
  handleRegisterPrompt,
  handleCancel,
  handleRegistrationConfirm,
  handleViewProfile,
  handleLogin,
  handleLoginConfirm,
  handleRegisterSendOtp,
  handleRegisterVerifyOtp,
} = require("./auth");

const { handleMenu } = require("./menu");
const { auth } = require("../authWrapper");
const {
  handleInitiateWalletGeneration,
  handleGenerateWallet,
  handleDeposit,
  handleWithdraw,
  handleWithdrawSelect,
  handleDepositWalletSelect,
  handleDepositNetworkSelect,
  handleWithdrawOptions,
  handleAssets,
} = require("./wallet");
const { handleStartKyc, handleKycBVN } = require("./kyc");

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
    command: "/register:send-otp",
    function: handleRegisterSendOtp,
  },
  {
    command: "/register:verify-otp",
    function: handleRegisterVerifyOtp,
  },
  {
    command: "/register",
    function: handleRegisterPrompt,
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
    command: "/login",
    function: handleLogin,
  },
  {
    command: "/login:confirm",
    function: handleLoginConfirm,
  },
  {
    command: "/kyc",
    function: auth(handleStartKyc),
  },
  {
    command: "/kyc:bvn",
    function: auth(handleKycBVN),
  },
  {
    command: "/wallet:initiate",
    function: auth(handleInitiateWalletGeneration),
  },
  {
    command: "/profile",
    function: auth(handleViewProfile),
  },
  {
    command: "/wallet:generate",
    function: auth(handleGenerateWallet),
  },
  {
    command: "/deposit",
    function: auth(handleDeposit, true, true),
  },
  {
    command: "/deposit:wallet",
    function: auth(handleDepositWalletSelect, true, true),
  },
  {
    command: "/deposit:network",
    function: auth(handleDepositNetworkSelect, true, true),
  },
  {
    command: "/withdraw",
    function: auth(handleWithdraw, true, true),
  },
  {
    command: "/withdraw:select",
    function: auth(handleWithdrawSelect, true, true),
  },
  {
    command: "/withdraw:options",
    function: auth(handleWithdrawOptions, true, true),
  },
  {
    command: "/my-assets",
    function: auth(handleAssets, true, true),
  },
  {
    command: "/menu",
    function: auth(handleMenu, false),
  },
  {
    command: "/buy",
    function: auth(() => {}, true, true),
  },
  {
    command: "/sell",
    function: auth(() => {}, true, true),
  },
];

module.exports = {
  commands,
};
