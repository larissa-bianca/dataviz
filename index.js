const mongoose = require("mongoose");
const app = require("./config/express");
const logger = require("./config/logger");
const config = require("./config/config");

Promise = require("bluebird"); // eslint-disable-line no-global-assign

// plugin bluebird promise in mongoose
mongoose.Promise = Promise;

// connect to mongo db
const mongoUri = config.mongo.host;
mongoose.connect(mongoUri, { keepAlive: 1 });
mongoose.connection.on("error", () => {
	throw new Error(`unable to connect to database: ${mongoUri}`);
});

mongoose.connection.once("open", () => {
	logger.info(`Connected to database on host ${mongoUri}`);
	console.log(`Connected to database on host ${mongoUri}`);
});

if (config.env !== "test") {
	app.listen(config.port, () => {
		logger.info(`[SERVER] Listening on port ${config.port}`);
	});
}

module.exports = app;
