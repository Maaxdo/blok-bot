const {
  sendAuthPrompt,
  handleRegisterPrompt,
  handleRegisterStep1,
  handleRegisterStep2,
  handleRegisterStep3,
  handleRegisterStep4,
  handleCancel,
  handleRegistrationConfirm,
  handleViewProfile,
} = require("./auth");

const { handleMenu } = require("./menu");
const { auth } = require("../authWrapper");
const {
  handleInitiateWalletGeneration,
  handleGenerateWallet,
  handleDeposit,
  handleDepositSelect,
  handleWithdraw,
  handleWithdrawSelect,
  handleWithdrawAmount,
  handleWithdrawAddress,
  handleWithdrawPin,
} = require("./wallet");
const { handleStartKyc } = require("./kyc");

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
    command: "/kyc",
    function: handleStartKyc,
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
    function: auth(handleDeposit),
  },
  {
    command: "/deposit:select",
    function: auth(handleDepositSelect),
  },
  {
    command: "/withdraw",
    function: auth(handleWithdraw),
  },
  {
    command: "/withdraw:select",
    function: auth(handleWithdrawSelect),
  },
  {
    command: "/withdraw:amount",
    function: auth(handleWithdrawAmount),
  },
  {
    command: "/withdraw:address",
    function: auth(handleWithdrawAddress),
  },
  {
    command: "/withdraw:pin",
    function: auth(handleWithdrawPin),
  },
  {
    command: "/menu",
    function: auth(handleMenu),
  },
  {
    command: "/buy",
    function: auth(() => {}, true),
  },
  {
    command: "/sell",
    function: auth(() => {}, true),
  },
];

module.exports = {
  commands,
};
