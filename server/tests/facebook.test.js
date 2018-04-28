const request = require("supertest");
const httpStatus = require("http-status");
const app = require("../../index");
const facebookAccount = require("../models/facebook.model");
const facebookStub = require("./facebook.stub.json").facebook;

beforeAll(async () => {
	await facebookAccount.collection.insert(facebookStub);
});

/**
 * Possibility of all tests accessing the same server
 */
afterAll(async () => {
	await facebookAccount.collection.drop();
});

/**
 * Test case for the /facebook, and derived pages, endpoint.
 * Tests behavior of sad path for now.
*/
describe("Facebook endpoint", () => {
	let accountId1;
	let accountId2;

	// When required, access should be granted
	it("GET /facebook should return a JSON with all the users in the db", async (done) => {
		const res = await request(app).get("/facebook").expect(httpStatus.OK);

		expect(res.body).toHaveProperty("error");
		expect(res.body.error).toBe(false);

		expect(res.body).toHaveProperty("accounts");
		expect(res.body.accounts).toBeInstanceOf(Array);
		expect(res.body.accounts.length).toEqual(facebookStub.length);

		accountId1 = res.body.accounts[0]._id; // eslint-disable-line
		accountId2 = res.body.accounts[1]._id; // eslint-disable-line

		done();
	});

	// When requires, access should be granted
	it("GET /facebook/help should return the routes' guide", async (done) => {
		const res = await request(app).get("/facebook/help").expect(httpStatus.OK);

		expect(res.body).toHaveProperty("error");
		expect(res.body.error).toBe(false);

		expect(res.body).toHaveProperty("results");
		expect(res.body.results).toBeInstanceOf(Object);

		done();
	});

	// When requires, access should be granted
	it("GET /facebook/:name should return all data from a certain user", async (done) => {
		const res = await request(app).get(`/facebook/${accountId1}`).expect(httpStatus.OK);

		expect(res.body).toHaveProperty("error");
		expect(res.body.error).toBe(false);

		expect(res.body).toHaveProperty("account");
		expect(res.body.account).toBeInstanceOf(Object);
		expect(res.body.account).toHaveProperty("links");
		expect(res.body.account.links.length).toEqual(2);
		expect(res.body.account.name).toEqual("José Maria");
		expect(res.body.account.class).toEqual("joseClass");
		expect(res.body.account.link).toEqual("joseLink/jose/");
		expect(res.body.account.history.length).toEqual(3);

		expect(res.body.account.history[0].likes).toEqual(42);
		expect(res.body.account.history[0].followers).toEqual(420);
		expect(res.body.account.history[0].date).toEqual("1994-12-24T02:00:00.000Z");

		expect(res.body.account.history[1].likes).toEqual(40);
		expect(res.body.account.history[1].followers).toEqual(840);
		expect(res.body.account.history[1].date).toEqual("1995-01-24T02:00:00.000Z");

		expect(res.body.account.history[2].likes).toEqual(45);
		expect(res.body.account.history[2].followers).toEqual(1000);
		expect(res.body.account.history[2].date).toEqual("1995-02-24T02:00:00.000Z");
		done();
	});

	// When requires, access should be granted
	it("GET /facebook/error should return message error", async (done) => {
		const res = await request(app)
			.get("/facebook/error")
			.expect(httpStatus.INTERNAL_SERVER_ERROR);

		expect(res.body).toHaveProperty("error");
		expect(res.body.error).toBe(true);

		expect(res.body).toHaveProperty("description");
		done();
	});

	it("GET /facebook/import shoul import all data from the spreadsheets to localBD", async (done) => {
		await request(app).get("/facebook/import").expect(httpStatus.FOUND);

		done();
	});

	// When requires, access should be granted
	it("GET /facebook/latest/:username should return the latest data from a user", async (done) => {
		const res = await request(app).get(`/facebook/latest/${accountId1}`).expect(httpStatus.OK);

		expect(res.body).toHaveProperty("error");
		expect(res.body.error).toBe(false);

		expect(res.body).toHaveProperty("latest");
		expect(res.body.latest).toBeInstanceOf(Object);

		expect(res.body.latest.likes).toEqual(45);
		expect(res.body.latest.followers).toEqual(1000);

		done();
	});

	// When requires, access should be granted
	it("GET /facebook/compare/:query?actors={:id} should return an image (the graph)", async (done) => {
		expect(accountId1).toBeDefined();
		expect(accountId2).toBeDefined();

		const res = await request(app).get(`/facebook/compare/likes?actors=${accountId1},${accountId2}`).expect(httpStatus.OK);

		expect(res.header["content-type"]).toEqual("image/png");

		done();
	});

	// When required, access should be granted
	it("GET /facebook/:username/likes should return an image (the graph)", async (done) => {
		expect(accountId1).toBeDefined();

		const res = await request(app).get(`/facebook/${accountId1}/likes`).expect(httpStatus.OK);

		expect(res.header["content-type"]).toEqual("image/png");

		done();
	});

	// When required, access should be granted
	it("GET /facebook/:username/followers should return an image (the graph)", async (done) => {
		expect(accountId1).toBeDefined();

		const res = await request(app).get(`/facebook/${accountId1}/followers`).expect(httpStatus.OK);

		expect(res.header["content-type"]).toEqual("image/png");

		done();
	});

	// When required, access should be granted
	it("GET /facebook/:username/qualquer should return an image (the graph)", async (done) => {
		expect(accountId1).toBeDefined();

		await request(app).get(`/facebook/${accountId1}/qualquer`).expect(httpStatus.NOT_FOUND);

		done();
	});
});

