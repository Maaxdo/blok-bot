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
  handleLogout,
  handleLogoutConfirm,
  handleLogoutCancel,
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
  handleBuy,
  handleBuySelect,
  handleBuyOptions,
  handleSell,
  handleSellWalletSelect,
  handleSellAccountSelect,
  handleSellOptions,
  handleBuyConfirmPayment,
} = require("./wallet");
const { handleStartKyc, handleKycBVN } = require("./kyc");
const {
  handleAccounts,
  handleAccountAdd,
  handleBanksNext,
  handleBanksPrev,
  handleBankSelect,
  handleAccountAddNumber,
  handleAccountAddCancel,
  handleAccountAddConfirm,
  handleAccountDelete,
  handleAccountDeleteSelect,
  handleAccountDeleteCancel,
  handleAccountDeleteConfirm,
  handleBankOptions,
} = require("./accounts");
const {
  handleTransactions,
  handleTransactionsDate,
  handleTransactionsNext,
  handleTransactionsPrev,
} = require("./transactions");

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
    command: "/logout",
    function: handleLogout,
  },
  {
    command: "/logout:confirm",
    function: handleLogoutConfirm,
  },
  {
    command: "/logout:cancel",
    function: handleLogoutCancel,
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
    function: auth(handleDeposit, false, false),
  },
  {
    command: "/deposit:wallet",
    function: auth(handleDepositWalletSelect, false, false),
  },
  {
    command: "/deposit:network",
    function: auth(handleDepositNetworkSelect, false, false),
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
    function: auth(handleMenu, false, true),
  },
  {
    command: "/buy",
    function: auth(handleBuy, false, false),
  },
  {
    command: "/buy:select",
    function: auth(handleBuySelect, false, false),
  },
  {
    command: "/buy:options",
    function: auth(handleBuyOptions, false, false),
  },
  {
    command: "/buy:confirm-payment",
    function: auth(handleBuyConfirmPayment, false, false),
  },
  {
    command: "/sell",
    function: auth(handleSell, false, false),
  },
  {
    command: "/sell:wallet:select",
    function: auth(handleSellWalletSelect, false, false),
  },
  {
    command: "/sell:account:select",
    function: auth(handleSellAccountSelect, false, false),
  },
  {
    command: "/sell:options",
    function: auth(handleSellOptions, false, false),
  },
  {
    command: "/accounts",
    function: auth(handleAccounts, false, false),
  },
  {
    command: "/accounts:add",
    function: auth(handleAccountAdd, false, false),
  },
  {
    command: "/accounts:banks",
    function: auth(handleBankOptions, false, false),
  },
  {
    command: "/accounts:add:number",
    function: auth(handleAccountAddNumber, false, false),
  },
  {
    command: "/accounts:add:cancel",
    function: auth(handleAccountAddCancel, false, false),
  },
  {
    command: "/accounts:add:confirm",
    function: auth(handleAccountAddConfirm, false, false),
  },
  {
    command: "/accounts:banks:select",
    function: auth(handleBankSelect, false, false),
  },
  {
    command: "/accounts:delete",
    function: auth(handleAccountDelete, false, false),
  },
  {
    command: "/accounts:delete:select",
    function: auth(handleAccountDeleteSelect, false, false),
  },
  {
    command: "/accounts:delete:cancel",
    function: auth(handleAccountDeleteCancel, false, false),
  },
  {
    command: "/accounts:delete:confirm",
    function: auth(handleAccountDeleteConfirm, false, false),
  },
  {
    command: "/transactions",
    function: auth(handleTransactions, false, false),
  },
  {
    command: "/transactions:dates",
    function: auth(handleTransactionsDate, false, false),
  },
  {
    command: "/transactions:next",
    function: auth(handleTransactionsNext, false, false),
  },
  {
    command: "/transactions:prev",
    function: auth(handleTransactionsPrev, false, false),
  },
];

module.exports = {
  commands,
};
