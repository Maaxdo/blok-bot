const { sendMessage } = require("../../../helpers/webhook/whatsapp");
const { WajerAxios } = require("../../../helpers/webhook/wajer");

async function handleProfile(user) {
	const userData = await WajerAxios({
		url: "/api/user",
		headers: {
			Authorization: `Bearer ${user.apiKey}`,
		},
	}).then((res) => res.data);

	const balance = new Intl.NumberFormat("en-NG", {
		style: "currency",
		currency: "NGN",
	}).format(userData.balance);

	const message = `
  *Profile Details*\n
    *Name*: ${userData.firstname} ${userData.lasttname ?? ""}\n  
    *Username*: ${userData.username}\n  
    *Email address*: ${userData.email}\n  
    *Phone*: ${userData.country_code} ${userData.phone_code} ${
			userData.phone
		}\n  
    *Balance*: ${balance}\n  
    *Address*: ${userData.address ?? ""}\n  
  `;

	await sendMessage(user.phone, message);
}

async function handleViewBalance(user) {
	const userData = await WajerAxios({
		url: "/api/user",
		headers: {
			Authorization: `Bearer ${user.apiKey}`,
		},
	}).then((res) => res.data);

	const balance = new Intl.NumberFormat("en-NG", {
		style: "currency",
		currency: "NGN",
	}).format(userData.balance);

	const message = `
    *Balance Details*\n
    *Balance*: ${balance}\n  
    `;

	await sendMessage(user.phone, message);
}

module.exports = {
	handleProfile,
	handleViewBalance,
};
