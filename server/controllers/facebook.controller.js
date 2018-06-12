/*	Required modules */
const ChartNode = require("chartjs-node");
const mongoose = require("mongoose");
const Facebook = require("../models/facebook.model");
const logger = require("../../config/logger");
const ResocieObs = require("../../config/resocie.json").observatory;
const httpStatus = require("../../config/resocie.json").httpStatus;

const geralCtrl = require("./geral.controller");
const viewCtrl = require("./view.controller");

/*	Global constants */
const SOCIAL_MIDIA = ResocieObs.socialMidia.facebookMidia;

/*	Route final methods */
/**
 * Search for all registered Facebook accounts.
 * @param {object} req - standard request object from the Express library
 * @param {object} res - standard response object from the Express library
 * @return {object} result - list with all registered accounts, displaying the link and the name
 * @return {String} description - error warning
 */
const listAccounts = async (req, res) => {
	try {
		const accounts = await Facebook.find({}, "name username link");

		const importLink = await getInitialLink(req, accounts);

		res.status(httpStatus.OK).json({
			error: false,
			import: importLink,
			accounts,
		});
	} catch (error) {
		const errorMsg = `Erro ao carregar usuários do ${geralCtrl.capitalize(SOCIAL_MIDIA)} nos registros`;

		stdErrorHand(res, httpStatus.ERROR_LIST_ACCOUNTS, errorMsg, error);
	}
};

/**
 * Route Guide Page
 * @param {object} req - standard request object from the Express library
 * @param {object} res - standard response object from the Express library
 */
const help = (req, res) => {
	const routes = [{
		root: "/ - Lista com todos os usuários registrados no banco de dados;",
		help: "/help - Exibição desta lista guia das rotas;",
		import: "/import - Aquisição dos dados, referente ao Facebook, armazenados nas planilhas do Google;",
		user: "/:name - Exibição de todos os dados registrados sobre um dado usuário;",
		latest: "/latest/:name - Exibição do último histórico válido para um dado usuário;",
		likes: "/:name/likes - Exibição da evolução de curtidas para um dado usuário;",
		followers: "/:name/followers - Exibição da evolução de seguidores para um dado usuários.",
	}];

	res.status(httpStatus.OK).json({
		error: false,
		results: routes,
	});
};

/**
 * Insert all Facebook accounts available.
 * @param {object} req - standard request object from the Express library
 * @param {object} res - standard response object from the Express library
 */
const importAccounts = async (req, res) => {
	const tabs = req.collectives;
	const length = tabs.length;
	const actors = {};
	const categories = req.sheet.categories;
	const facebookRange = req.sheet.facebookRange;
	const nameRow = req.sheet.range.nameRow;
	const linkRow = facebookRange.linkRow;
	const likesRow = facebookRange.likesRow;
	const followersRow = facebookRange.followersRow;
	const dateRow = facebookRange.dateRow;
	let cCategory = 0;
	let lastDate;

	mongoose.connection.collections.facebook.deleteMany();

	for (let posSheet = 0; posSheet < length; posSheet += 1) {
		const cSheet = tabs[posSheet];
		const rowsCount = cSheet.length;
		cCategory = 0;

		for (let posRow = 0; posRow < rowsCount; posRow += 1) {
			const cRow = cSheet[posRow];

			if (!cRow[nameRow] || posRow < 1) {
				continue; // eslint-disable-line no-continue
			}

			// Se estivermos na row que indicao o novo tipo, atualiza
			// a string do tipo atual e continua para a próxima row
			if (cRow[nameRow] === categories[cCategory + 1]) {
				cCategory += 1;
				continue; // eslint-disable-line no-continue
			}

			const accountLink = getImportAccountLink(cRow[linkRow]);

			if (actors[cRow[nameRow]] === undefined) {
				const newAccount = Facebook({
					name: cRow[nameRow].replace(/\n/g, " "),
					class: categories[cCategory],
					link: accountLink,
					username: getImportUsername(accountLink),
				});

				actors[cRow[nameRow]] = newAccount;
			} else if (!actors[cRow[nameRow]].username) {
				actors[cRow[nameRow]].link = accountLink;
				actors[cRow[nameRow]].username = accountLink;
			}

			if (accountLink) {
				for (let posRow2 = linkRow; posRow2 <= dateRow; posRow2 += 1) {
					if (!isCellValid(cRow[posRow2])) {
						cRow[posRow2] = null;
					} else if (posRow2 === likesRow	|| posRow2 === followersRow) {
						cRow[posRow2] = getImportNumber(cRow[posRow2]);
					}
				}

				const newDate = getImportDate(cRow[dateRow], lastDate);
				lastDate = newDate;

				const newHistory = {
					likes: cRow[likesRow],
					followers: cRow[followersRow],
					date: new Date(`${newDate[1]}/${newDate[0]}/${newDate[2]}`),
				};

				actors[cRow[nameRow]].history.push(newHistory);
			}
		}
	}
	const savePromises = [];
	Object.entries(actors).forEach((cActor) => {
		savePromises.push(cActor[1].save());
	});

	await Promise.all(savePromises);
	return res.redirect("/facebook");
};

/**
 * Data recovery about a given user
 * @param {object} req - standard request object from the Express library
 * @param {object} res - standard response object from the Express library
 */
const getUser = (req, res) => {
	try {
		const account = req.account[0].toObject();
		account.links = getQueriesLink(req, account.username);

		res.status(httpStatus.OK).json({
			error: false,
			account,
		});
	} catch (error) {
		const errorMsg = "Erro enquanto configura-se o usuário";

		stdErrorHand(res, httpStatus.ERROR_GET_USER, errorMsg, error);
	}
};

/**
 * Data recovery latest about a given user
 * @param {object} req - standard request object from the Express library
 * @param {object} res - standard response object from the Express library
 */
const getLatest = (req, res) => {
	try {
		const history = req.account[0].toObject().history;
		const length = history.length - 1;
		const latest = {};
		const limit = ResocieObs.queriesRange.facebookQueries;
		const queries = ResocieObs.queries.facebookQueries;
		let count = 0;

		for (let ind = length; ind >= 0 && count <= limit; ind -= 1) {
			for (query of queries) {						// eslint-disable-line
				if (latest[query] === undefined				// eslint-disable-line
					&& history[ind][query] !== undefined) {	// eslint-disable-line
					latest[query] = history[ind][query];	// eslint-disable-line
					count += 1;
				}
			}
		}

		req.account[0].history.latest = latest;

		res.status(httpStatus.OK).json({
			error: false,
			latest,
		});
	} catch (error) {
		const errorMsg = `Error enquanto se recuperava os últimos dados válidos para o usuário [${req.account.name}], no ${geralCtrl.capitalize(SOCIAL_MIDIA)}`;

		stdErrorHand(res, httpStatus.ERROR_LATEST, errorMsg, error);
	}
};


/*	Route middlewares */
/**
 * Look for a specific registered Facebook account, by id.
 * @param {object} req - standard request object from the Express library
 * @param {object} res - standard response object from the Express library
 * @param {object} next - standard next function
 * @returns Execution of the next feature, over the data found
 */
const loadAccount = async (req, res, next) => {
	try {
		if (req.actors !== undefined) {
			for (const cActor of req.actors) {	// eslint-disable-line
				await findAccount(req, cActor);	// eslint-disable-line
			} 									// eslint-disable-line
		} else {
			const id = req.params.id;
			await findAccount(req, id);
		}

		return next();
	} catch (error) {
		let id;
		if (req.actors !== undefined) {
			id = req.actors;
		} else {
			id = req.params.id;
		}

		const errorMsg = `Error ao carregar usuário(s) [${id}] dos registros do ${geralCtrl.capitalize(SOCIAL_MIDIA)}`;

		return stdErrorHand(res, httpStatus.ERROR_LOAD_ACCOUNT, errorMsg, error);
	}
};

/**
 * Layer to query requested identification
 * @param {object} req - standard request object from the Express library
 * @param {object} res - standard response object from the Express library
 * @param {object} next - standard next function
 * @returns Execution of the next feature, over the history key generated
 */
const setHistoryKey = (req, res, next) => {
	const queriesPT = ResocieObs.queriesPT.facebookQueriesPT;
	const historyKey = req.params.query;
	const historyKeyPT = queriesPT[historyKey];
	const errorMsg = `Não existe a caracteristica [${historyKey}] para o ${geralCtrl.capitalize(SOCIAL_MIDIA)}`;

	let chartTitle;

	if (historyKeyPT !== undefined) {
		chartTitle = viewCtrl.evolutionMsg(historyKeyPT, SOCIAL_MIDIA);
	} else {
		logger.error(`${errorMsg} - Tried to access ${req.originalUrl}`);
		return res.status(httpStatus.ERROR_QUERY_KEY).json({
			error: true,
			description: errorMsg,
		});
	}

	req.chart = {
		historyKey: historyKey,
		historyKeyPT: historyKeyPT,
		chartTitle: chartTitle,
	};

	return next();
};

/*	Methods of abstraction upon request */
/**
 * Search for an account in the records and making it available
 * @param {object} req - standard request object from the Express library
 * @param {object} id - standard identifier of a Facebook account
 */
const findAccount = async (req, id) => {
	const account = await Facebook.findOne({ username: id }, "-_id -__v");

	if (!account) throw TypeError(`There is no user [${id}]`);

	if (req.account === undefined) req.account = [];

	req.account.push(account);
};

/**
 * Acquiring the links to the home page
 * @param {object} req - standard request object from the Express library
 * @param {object} accounts - Accounts registered for Facebook
 */
const getInitialLink = (req, accounts) => {
	getAccountLink(req, accounts);
	return getImportLink(req, SOCIAL_MIDIA);
};

/**
 * Acquire links to all registered Facebook accounts
 * @param {object} req - standard request object from the Express library
 * @param {object} accounts - Accounts registered for Facebook
 */
const getAccountLink = (req, accounts) => {
	const length = accounts.length;

	for (let i = 0; i < length; i += 1) {
		accounts[i] = accounts[i].toObject();
		accounts[i].links = [];
		const id = accounts[i].username;

		if (id) {
			const link = {
				rel: `${SOCIAL_MIDIA}.account`,
				href: `${req.protocol}://${req.get("host")}/${SOCIAL_MIDIA}/${id}`,
			};
			accounts[i].links.push(link);
		}
	}
};

/**
 * Acquiring link to import from Facebook accounts
 * @param {object} req - standard request object from the Express library
 */
const getImportLink = (req) => {
	return {
		rel: `${SOCIAL_MIDIA}.import`,
		href: `${req.protocol}://${req.get("host")}/${SOCIAL_MIDIA}/import`,
	};
};

/**
 * Acquiring the links to the possible queries for Facebook
 * @param {object} req - standard request object from the Express library
 * @param {object} id - standard identifier of a Facebook account
 */
const getQueriesLink = (req, id) => {
	const links = [];
	const midiaQueries = ResocieObs.queries.facebookQueries;

	links.push(getCommomLink(req, id));

	for (query of midiaQueries) {								// eslint-disable-line
		links.push(getQueryLink(req, id, query));	// eslint-disable-line
	}

	return links;
};

/**
 * Acquisition of the link to the common query among all social media
 * @param {object} req - standard request object from the Express library
 * @param {object} id - standard identifier of a Facebook account
 */
const getCommomLink = (req, id) => {
	const commom = ResocieObs.queries.commonQuery;

	return {
		rel: `${SOCIAL_MIDIA}.account.${commom}`,
		href: `${req.protocol}://${req.get("host")}/${SOCIAL_MIDIA}/${commom}/${id}`,
	};
};

/**
 * Acquire the link to a given query for Facebook
 * @param {object} req - standard request object from the Express library
 * @param {object} id - standard identifier of a Facebook account
 * @param {object} query - query requested
 */
const getQueryLink = (req, id, query) => {
	return {
		rel: `${SOCIAL_MIDIA}.account.${query}`,
		href: `${req.protocol}://${req.get("host")}/${SOCIAL_MIDIA}/${id}/${query}`,
	};
};

/*	Methods of abstraction upon response */
/**
 * Standard Error Handling
 * @param {object} res - standard response object from the Express library
 * @param {number} erroCode - error code for the situation
 * @param {String} errorMsg - error message for the situation
 * @param {object} error - error that actually happened
 */
const stdErrorHand = (res, errorCode, errorMsg, error) => {
	logger.error(`${errorMsg} - Detalhes: ${error}`);

	res.status(errorCode).json({
		error: true,
		description: errorMsg,
	});
};


/**
 * Data validation by recurrent criteria
 * @param {String} value - data to be validated
 * @returns true if it is not valid, false if it is valid
 */
const isCellValid = (value) => {
	if (!value) return false;

	value = value.toUpperCase();

	if (value === "-"
		|| value === "S"
		|| value === "S/") {
		return false;
	}

	return true;
};

/**
 * Acquire the account link from the import base
 * @param {string} accountLink - supposed account link
 */
const getImportAccountLink = (accountLink) => {
	if (isCellValid(accountLink)) return accountLink;

	return null;
};

/**
 * Acquire the account username from the import base
 * @param {string} usernameRaw - supposed account username
 */
const getImportUsername = (usernameRaw) => {
	if (!(usernameRaw) || !(usernameRaw.includes(`${SOCIAL_MIDIA}.com`))) return null;

	let username = usernameRaw.replace(`https://www.${SOCIAL_MIDIA}.com/`, "");
	username = username.replace(`https://${SOCIAL_MIDIA}.com/`, "");
	username = username.split("/");

	if (username[0] !== "pg")	username = username[0];
	else username = username[1];

	username = username.split("?");

	return username[0];
};

/**
 * Acquire a number from the import base
 * @param {string} number - supposed valid number
 */
const getImportNumber = (number) => {
	number = parseInt(number.replace(/\.|,/g, ""), 10);

	if (Number.isNaN(number)) number = null;

	return number;
};

/**
 * Acquire a date from the import base
 * @param {string} date - supposed valid date
 * @param {array} lastDate - last valid date
 */
const getImportDate = (date, lastDate) => {
	if (!date) return lastDate;

	date = date.split("/");

	if (!(date) || date.length !== 3) date = lastDate;

	return date;
};

module.exports = {
	listAccounts,
	help,
	importAccounts,
	getUser,
	getLatest,
	loadAccount,
	isCellValid,
	setHistoryKey,
};
