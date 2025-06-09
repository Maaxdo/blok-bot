const {
  handleLoginAuth,
  handleLoginPrompt,
  sendAuthPrompt,
  handleLogout,
  handleRegisterPrompt,
  handleRegisterAuth,
} = require("./auth");
const {
  handleViewBetSlip,
  handleClearBetSlip,
  handlePlaceBetPrompt,
  handlePlaceBetAmount,
  handleConfirmBet,
} = require("./bet-slips");
const { handleAddFund, handleAddFundAction } = require("./funds");
const { handleMenu } = require("./menu");
const {
  handleViewsports,
  handleViewEvents,
  handleViewEventOdds,
  handleSelectOdd,
} = require("./sports");
const { handleProfile, handleViewBalance } = require("./user");
const {
  handleViewAccounts,
  handleViewBanks,
  handleBankSelect,
  handleResolveAccount,
  handleConfirmAccount,
} = require("./accounts");
const {
  handleViewAccountDetails,
  handleSelectAmount,
  handleConfirmAmount,
  handleProceed,
} = require("./withdrawal");

const { auth } = require("../authWrapper");
const { sendInteractiveTest } = require("./interactive");
const {
  handleViewBetHistory,
  handleHistoryPaginate,
} = require("./bet-history");

const commands = [
  {
    command: "/test",
    function: sendInteractiveTest,
  },
  {
    command: "/start",
    function: sendAuthPrompt,
  },
  {
    command: "/login",
    function: handleLoginPrompt,
  },
  {
    command: "/login:auth",
    function: handleLoginAuth,
  },
  {
    command: "/register",
    function: handleRegisterPrompt,
  },
  {
    command: "/register:auth",
    function: handleRegisterAuth,
  },
  {
    command: "/logout",
    function: auth(handleLogout),
  },
  {
    command: "/menu",
    function: auth(handleMenu),
  },
  {
    command: "/sports",
    function: auth(handleViewsports),
  },
  {
    command: "/sports:select",
    function: auth(handleViewEvents),
  },
  {
    command: "/sports:select:event",
    function: auth(handleViewEventOdds),
  },
  {
    command: "/sports:select:event:odds",
    function: auth(handleSelectOdd),
  },
  {
    command: "/bet-slips",
    function: auth(handleViewBetSlip),
  },
  {
    command: "/bet-slips:clear",
    function: auth(handleClearBetSlip),
  },
  {
    command: "/bet-slips:place-bet",
    function: auth(handlePlaceBetPrompt),
  },
  {
    command: "/bet-slips:place-bet:amount",
    function: auth(handlePlaceBetAmount),
  },
  {
    command: "/bet-slips:place-bet:confirm",
    function: auth(handleConfirmBet),
  },
  {
    command: "/profile",
    function: auth(handleProfile),
  },
  {
    command: "/balance",
    function: auth(handleViewBalance),
  },
  {
    command: "/add-funds",
    function: auth(handleAddFund),
  },
  {
    command: "/add-funds:amount",
    function: auth(handleAddFundAction),
  },
  {
    command: "/accounts",
    function: auth(handleViewAccounts),
  },
  {
    command: "/accounts:add",
    function: auth(handleViewBanks),
  },
  {
    command: "/accounts:banks:select",
    function: auth(handleBankSelect),
  },
  {
    command: "/accounts:account-number",
    function: auth(handleResolveAccount),
  },
  {
    command: "/accounts:confirm-complete",
    function: auth(handleConfirmAccount),
  },
  {
    command: "/withdraw",
    function: auth(handleViewAccountDetails),
  },
  {
    command: "/withdraw:account:select",
    function: auth(handleSelectAmount),
  },
  {
    command: "/withdraw:amount",
    function: auth(handleConfirmAmount),
  },
  {
    command: "/withdraw:confirm",
    function: auth(handleProceed),
  },
  {
    command: "/history",
    function: auth(handleViewBetHistory),
  },
  {
    command: "/history:paginate",
    function: auth(handleHistoryPaginate),
  },
];

module.exports = {
  commands,
};
