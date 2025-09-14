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
  handleResetPassword,
  handleResetPasswordCode,
  handleResetPasswordEmail,
} = require("./auth");

const { handleMenu } = require("./menu");
const { auth } = require("../authWrapper");
const {
  handleInitiateWalletGeneration,
  handleGenerateWallet,
  handleAssets,
  handleBuy,
  handleBuySelect,
  handleBuyOptions,
  handleSell,
  handleSellWalletSelect,
  handleSellAccountSelect,
  handleSellOptions,
  handleBuyConfirmPayment,
  handleSellNetworksSelect,
  handleBuyNetworksSelect,
  handleDestinationAddress,
  handleDestinationAddressPromptYes,
  handleDestinationAddressPromptNo,
  handleDestinationAddressConfirm,
  handleAddress,
  handleAddressWalletSelect,
  handleAddressNetworkSelect,
} = require("./wallet");
const { handleStartKyc, handleKycBVN } = require("./kyc");
const {
  handleAccounts,
  handleAccountAdd,
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
const { handleRates } = require("./rates");
const { handleSupport } = require("./support");

const commands = [
  {
    command: "/start",
    function: sendAuthPrompt,
  },
  {
    command: "/reset-password",
    function: handleResetPassword,
  },
  {
    command: "/reset-password:email",
    function: handleResetPasswordEmail,
  },
  {
    command: "/reset-password:code",
    function: handleResetPasswordCode,
  },
  {
    command: "/register",
    function: handleRegisterPrompt,
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
    command: "/rates",
    function: auth(handleRates, true, true),
    nplMessage: "I want to see the latest rates",
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
  // {
  //   command: "/deposit",
  //   function: auth(handleDeposit, false, false),
  // },
  // {
  //   command: "/deposit:wallet",
  //   function: auth(handleDepositWalletSelect, false, false),
  // },
  // {
  //   command: "/deposit:network",
  //   function: auth(handleDepositNetworkSelect, false, false),
  // },
  // {
  //   command: "/withdraw",
  //   function: auth(handleWithdraw, false, false),
  // },
  // {
  //   command: "/withdraw:select",
  //   function: auth(handleWithdrawSelect, false, false),
  // },
  // {
  //   command: "/withdraw:options",
  //   function: auth(handleWithdrawOptions, false, false),
  // },
  {
    command: "/my-assets",
    function: auth(handleAssets, true, true),
    nplMessage: "I want to view my assets",
  },
  {
    command: "/address",
    function: auth(handleAddress, true, true),
    nplMessage: "I want to see my address",
  },
  {
    command: "/address:wallet:select",
    function: auth(handleAddressWalletSelect, true, true),
  },
  {
    command: "/address:network:select",
    function: auth(handleAddressNetworkSelect, true, true),
  },
  {
    command: "/menu",
    function: auth(handleMenu, true, true),
  },
  {
    command: "/buy",
    function: auth(handleBuy, true, true),
    nplMessage: "I want to buy crypto",
  },
  {
    command: "/buy:select",
    function: auth(handleBuySelect, true, true),
  },
  {
    command: "/buy:options",
    function: auth(handleBuyOptions, true, true),
  },
  {
    command: "/buy:networks:select",
    function: auth(handleBuyNetworksSelect, true, true),
  },
  {
    command: "/buy:confirm-payment",
    function: auth(handleBuyConfirmPayment, true, true),
  },
  {
    command: "/buy:destination:yes",
    function: auth(handleDestinationAddressPromptYes, true, true),
  },
  {
    command: "/buy:destination:no",
    function: auth(handleDestinationAddressPromptNo, true, true),
  },
  {
    command: "/buy:destination:address",
    function: auth(handleDestinationAddress, true, true),
  },
  {
    command: "/buy:destination:address:confirm",
    function: auth(handleDestinationAddressConfirm, true, true),
  },
  {
    command: "/sell",
    function: auth(handleSell, true, true),
    nplMessage: "I want to sell crypto",
  },
  {
    command: "/sell:wallet:select",
    function: auth(handleSellWalletSelect, true, true),
  },
  {
    command: "/sell:account:select",
    function: auth(handleSellAccountSelect, true, true),
  },
  {
    command: "/sell:options",
    function: auth(handleSellOptions, true, true),
  },
  {
    command: "/sell:networks:select",
    function: auth(handleSellNetworksSelect, true, true),
  },
  {
    command: "/accounts",
    function: auth(handleAccounts, true, true),
  },
  {
    command: "/accounts:add",
    function: auth(handleAccountAdd, true, true),
  },
  {
    command: "/accounts:banks",
    function: auth(handleBankOptions, true, true),
  },
  {
    command: "/accounts:add:number",
    function: auth(handleAccountAddNumber, true, true),
  },
  {
    command: "/accounts:add:cancel",
    function: auth(handleAccountAddCancel, true, true),
  },
  {
    command: "/accounts:add:confirm",
    function: auth(handleAccountAddConfirm, true, true),
  },
  {
    command: "/accounts:banks:select",
    function: auth(handleBankSelect, true, true),
  },
  {
    command: "/accounts:delete",
    function: auth(handleAccountDelete, true, true),
  },
  {
    command: "/accounts:delete:select",
    function: auth(handleAccountDeleteSelect, true, true),
  },
  {
    command: "/accounts:delete:cancel",
    function: auth(handleAccountDeleteCancel, true, true),
  },
  {
    command: "/accounts:delete:confirm",
    function: auth(handleAccountDeleteConfirm, true, true),
  },
  {
    command: "/transactions",
    function: auth(handleTransactions, true, true),
  },
  {
    command: "/transactions:dates",
    function: auth(handleTransactionsDate, true, true),
  },
  {
    command: "/transactions:next",
    function: auth(handleTransactionsNext, true, true),
  },
  {
    command: "/transactions:prev",
    function: auth(handleTransactionsPrev, true, true),
  },
  {
    command: "/support",
    function: handleSupport,
  },
];

const walletCommands = ["/buy", "/sell"];

module.exports = {
  commands,
  walletCommands,
};
