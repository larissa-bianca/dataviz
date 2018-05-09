const request = require("supertest");
const httpStatus = require("http-status");
const app = require("../../index");
const youtubeAccount = require("../models/youtube.model");
const youtubeStub = require("./youtube.stub.json").accounts;
const youtubeCtrl = require("../controllers/youtube.controller");

beforeAll(async (done) => {
	await youtubeAccount.insertMany(youtubeStub);
	done();
});

afterAll(async (done) => {
	await youtubeAccount.deleteMany();
	done();
});

/**
 * Test case for the /youtube endpoint.
 */
describe("Youtube endpoint", () => {
	let accountId1;
	let accountId2;

	// When required, access should be granted
	it("GET /youtube should return a JSON with all the users in the db", async (done) => {
		const res = await request(app).get("/youtube").expect(httpStatus.OK);

		expect(res.body).toHaveProperty("error");
		expect(res.body.error).toBe(false);

		expect(res.body).toHaveProperty("accounts");
		expect(res.body.accounts).toBeInstanceOf(Array);
		expect(res.body.accounts.length).toEqual(youtubeStub.length);

		accountId1 = res.body.accounts[0]._id; // eslint-disable-line
		accountId2 = res.body.accounts[1]._id; // eslint-disable-line

		done();
	});

	// When requires, access should be granted
	it("GET /youtube/:name should return all data from a certain user", async (done) => {
		const res = await request(app).get(`/youtube/${accountId1}`).expect(httpStatus.OK);

		expect(res.body).toHaveProperty("error");
		expect(res.body.error).toBe(false);

		// expect(res.body).toHaveProperty("account");
		expect(res.body.account).toBeInstanceOf(Object);
		expect(res.body.account).toHaveProperty("links");
		expect(res.body.account.links.length).toEqual(4);
		expect(res.body.account.name).toEqual("Mariana");
		expect(res.body.account.category).toEqual("marianacategory");
		expect(res.body.account.channelUrl).toEqual("youtube.com/user/marianachannel");
		expect(res.body.account.history.length).toEqual(3);

		expect(res.body.account.history[0].subscribers).toEqual(542);
		expect(res.body.account.history[0].videos).toEqual(420);
		expect(res.body.account.history[0].views).toEqual(24);
		expect(res.body.account.history[0].date).toEqual("1994-12-24T02:00:00.000Z");

		expect(res.body.account.history[1].subscribers).toEqual(500);
		expect(res.body.account.history[1].videos).toEqual(840);
		expect(res.body.account.history[1].views).toEqual(84);
		expect(res.body.account.history[1].date).toEqual("1995-01-24T02:00:00.000Z");

		expect(res.body.account.history[2].subscribers).toEqual(532);
		expect(res.body.account.history[2].videos).toEqual(1000);
		expect(res.body.account.history[2].views).toEqual(420);
		expect(res.body.account.history[2].date).toEqual("1995-02-24T02:00:00.000Z");

		done();
	});

	it("GET /youtube/import shoul import all data from the spreadsheets to localBD", async (done) => {
		await request(app).get("/youtube/import").expect(httpStatus.FOUND);

		done();
	});

	// When required, access should be granted
	it("GET /youtube/:name/subscribers should return an image (the graph)", async (done) => {
		expect(accountId1).toBeDefined();
		const res = await request(app).get(`/youtube/${accountId1}/subscribers`).expect(httpStatus.OK);
		expect(res.header["content-type"]).toEqual("image/png");

		done();
	});

	// When required, access should be granted
	it("GET /youtube/:name/videos should return an image (the graph)", async (done) => {
		expect(accountId1).toBeDefined();
		const res = await request(app).get(`/youtube/${accountId1}/videos`).expect(httpStatus.OK);
		expect(res.header["content-type"]).toEqual("image/png");

		done();
	});

	// When required, access should be granted
	it("GET /youtube/:name/views should return an image (the graph)", async (done) => {
		expect(accountId1).toBeDefined();
		const res = await request(app).get(`/youtube/${accountId1}/views`).expect(httpStatus.OK);
		expect(res.header["content-type"]).toEqual("image/png");

		done();
	});

	it("GET /youtube/compare/subscribers?actors={:id} should return an image (the graph)", async (done) => {
		expect(accountId1).toBeDefined();
		expect(accountId2).toBeDefined();

		await request(app).get(`/youtube/compare/subscribers?actors=${accountId1},${accountId2}`).expect(httpStatus.OK);

		done();
	});

	it("GET /youtube/compare/videos?actors={:id} should return an image (the graph)", async (done) => {
		expect(accountId1).toBeDefined();
		expect(accountId2).toBeDefined();

		await request(app).get(`/youtube/compare/videos?actors=${accountId1},${accountId2}`).expect(httpStatus.OK);

		done();
	});

	it("GET /youtube/compare/views?actors={:id} should return an image (the graph)", async (done) => {
		expect(accountId1).toBeDefined();
		expect(accountId2).toBeDefined();

		await request(app).get(`/youtube/compare/views?actors=${accountId1},${accountId2}`).expect(httpStatus.OK);

		done();
	});
});

describe("Youtbe methods", () => {
	const param = "qualquer coisa";

	it("Recovery of evolution message", async (done) => {
		const result = "Evolução de qualquer coisa, no Youtube";
		const delivery = youtubeCtrl.evolutionMsg(param);

		expect(delivery).toEqual(result);

		done();
	});

	it("Recovery of a string capitalized", async (done) => {
		const result = "Qualquer Coisa";
		const param1 = "qualquercoisa";
		const result1 = "Qualquercoisa";
		const delivery = youtubeCtrl.capitalize(param);
		const delivery1 = youtubeCtrl.capitalize(param1);

		expect(delivery).toEqual(result);
		expect(delivery1).toEqual(result1);

		done();
	});

	it("Recovery of a cell valid or invalid", async (done) => {
		expect(youtubeCtrl.isCellValid(param)).toBe(true);
		expect(youtubeCtrl.isCellValid(null)).toBe(false);
		expect(youtubeCtrl.isCellValid(undefined)).toBe(false);
		expect(youtubeCtrl.isCellValid("-")).toBe(false);
		expect(youtubeCtrl.isCellValid("s")).toBe(false);
		expect(youtubeCtrl.isCellValid("s/")).toBe(false);
		expect(youtubeCtrl.isCellValid("S")).toBe(false);
		expect(youtubeCtrl.isCellValid("S/")).toBe(false);

		done();
	});
});
