/*	Required modules */
const express = require("express");
const facebookCtrl = require("../controllers/facebook.ctrl");
const spreadsheetsCtrl = require("../controllers/spreadsheets.controller");
const digitalMediaCtrl = require("../controllers/digitalMedia.ctrl");
const viewCtrl = require("../controllers/view.ctrl");

/*	Global constants */
const router = express.Router(); // eslint-disable-line new-cap

/**
 * Access to the Facebook data home page.
 * Presentation of all user registered, identified by name.
*/
router.route("/")
	.get(facebookCtrl.listAccounts);

/**
 * Acquisition of queries available to Facebook
 */
router.route("/queries")
	.get(facebookCtrl.getQueries);

/**
 * Acquisition of registered actors of a particular category
 */
router.route("/actors/:cat")
	.get(facebookCtrl.getActors);

/**
 * Comparison between actors for data on Facebook
 */
router.route("/compare/:query")
	.get(
		digitalMediaCtrl.splitActors,
		facebookCtrl.loadAccount,
		viewCtrl.getDataset,
		viewCtrl.getChartLimits,
		viewCtrl.getConfigLineChart,
		viewCtrl.plotLineChart,
	);

/**
 *  Inserting all records, redirecting to Facebook main page
 */
router.route("/import")
	.get(
		spreadsheetsCtrl.authenticate,
		spreadsheetsCtrl.setResocieSheet,
		spreadsheetsCtrl.listCollectives,
		facebookCtrl.importAccounts,
	);

/**
 * Access to the data home page of a given user.
 * Presentation of all the data registered.
 */
router.route("/:id")
	.get(facebookCtrl.getUser);

/**
 * Access to the latest valid data of a given user.
 */
router.route("/latest/:id")
	.get(facebookCtrl.getLatest);

/**
 * Presentation of the temporal evolution of a given query for a given user.
 */
router.route("/:id/:query")
	.get(
		viewCtrl.getDataset,
		viewCtrl.getChartLimits,
		viewCtrl.getConfigLineChart,
		viewCtrl.plotLineChart,
	);

/**
 * Search for a user in the database
 */
router.param("id", facebookCtrl.loadAccount);

/**
 * Sets the requested query
 */
router.param("query", facebookCtrl.setHistoryKey);

module.exports = router;
