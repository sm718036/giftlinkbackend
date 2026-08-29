import { expect } from "chai";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";

describe("GiftLink API", function () {
  this.timeout(300000);

  let mongoServer;
  let app;
  let firstToken;
  let secondToken;
  let firstGiftId;
  let secondGiftId;

  before(async () => {
    mongoServer = await MongoMemoryServer.create();
    process.env.NODE_ENV = "test";
    process.env.MONGO_URL = mongoServer.getUri("giftlink-test");
    process.env.JWT_SECRET = "integration-test-secret";
    process.env.DASHBOARD_URL = "http://localhost:5173";

    ({ app } = await import("../index.js"));
    const { connectToDatabase } = await import("../util/db.js");
    await connectToDatabase();
  });

  after(async () => {
    await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
  });

  it("reports health and returns JSON for unknown routes", async () => {
    const health = await request(app).get("/").expect(200);
    expect(health.body.message).to.equal("Connected to the server");
    await request(app).get("/not-a-route").expect(404, {
      success: false,
      message: "Route not found",
    });
  });

  it("validates registration and authenticates two users", async () => {
    await request(app).post("/api/auth/register").send({}).expect(400);

    const firstUser = {
      email: "First@Example.com",
      firstName: "First",
      lastName: "User",
      password: "password1",
    };
    await request(app).post("/api/auth/register").send(firstUser).expect(201);
    await request(app).post("/api/auth/register").send(firstUser).expect(409);
    await request(app)
      .post("/api/auth/login")
      .send({ email: firstUser.email, password: "wrong-password" })
      .expect(401);

    const firstLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "FIRST@example.com", password: firstUser.password })
      .expect(200);
    firstToken = firstLogin.body.authtoken;
    expect(firstToken).to.be.a("string");

    await request(app)
      .post("/api/auth/register")
      .send({
        email: "second@example.com",
        firstName: "Second",
        lastName: "User",
        password: "password2",
      })
      .expect(201);
    const secondLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "second@example.com", password: "password2" })
      .expect(200);
    secondToken = secondLogin.body.authtoken;
  });

  it("enforces authentication and supports profile and password changes", async () => {
    await request(app).get("/api/auth/me").expect(401);
    await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Basic invalid")
      .expect(401);
    const me = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${firstToken}`)
      .expect(200);
    expect(me.body.user).not.to.have.property("password");

    await request(app)
      .put("/api/auth/update")
      .set("Authorization", `Bearer ${firstToken}`)
      .send({ firstName: "Updated", lastName: "User" })
      .expect(200);
    await request(app)
      .put("/api/auth/change-password")
      .set("Authorization", `Bearer ${firstToken}`)
      .send({ currentPassword: "password1", newPassword: "newpassword1" })
      .expect(200);
    await request(app)
      .post("/api/auth/login")
      .send({ email: "first@example.com", password: "password1" })
      .expect(401);
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "first@example.com", password: "newpassword1" })
      .expect(200);
    firstToken = login.body.authtoken;
  });

  it("validates, creates, searches, paginates, and protects gifts", async () => {
    const gift = {
      name: "Desk [Lamp]",
      image: "data:image/jpeg;base64,AA==",
      description: "A working lamp",
      ageInYears: 2,
      condition: "Good",
      category: "Furniture",
      contactInfo: "first@example.com",
      address: "Test address",
    };
    await request(app).post("/api/gifts/post-gift").send(gift).expect(401);
    await request(app)
      .post("/api/gifts/post-gift")
      .set("Authorization", `Bearer ${firstToken}`)
      .send({ ...gift, ageInYears: -1 })
      .expect(400);
    const created = await request(app)
      .post("/api/gifts/post-gift")
      .set("Authorization", `Bearer ${firstToken}`)
      .send(gift)
      .expect(201);
    firstGiftId = created.body.gift._id;

    const publicList = await request(app).get("/api/gifts?currentPage=-4&limit=1000").expect(200);
    expect(publicList.body.gifts).to.have.length(1);
    expect(publicList.body.metaData).to.include({ currentPage: 1, limit: 100 });

    const ownFilteredList = await request(app)
      .get("/api/gifts")
      .set("Authorization", `Bearer ${firstToken}`)
      .expect(200);
    expect(ownFilteredList.body.gifts).to.have.length(0);
    expect(ownFilteredList.body.metaData).to.include({ totalCount: 0, totalPages: 0 });
    await request(app)
      .get("/api/gifts")
      .set("Authorization", "Bearer expired-or-invalid")
      .expect(200);

    const search = await request(app).get("/api/gifts/search").query({ name: "[Lamp]" }).expect(200);
    expect(search.body.gifts).to.have.length(1);

    await request(app)
      .get(`/api/gifts/${firstGiftId}`)
      .set("Authorization", `Bearer ${secondToken}`)
      .expect(200);
    await request(app)
      .get("/api/gifts/not-an-id")
      .set("Authorization", `Bearer ${secondToken}`)
      .expect(400);
    await request(app)
      .patch(`/api/gifts/update/${firstGiftId}`)
      .set("Authorization", `Bearer ${secondToken}`)
      .send({ isTaken: true })
      .expect(403);
    await request(app)
      .patch(`/api/gifts/update/${firstGiftId}`)
      .set("Authorization", `Bearer ${firstToken}`)
      .send({ ageInYears: "invalid" })
      .expect(400);
    await request(app)
      .patch(`/api/gifts/update/${firstGiftId}`)
      .set("Authorization", `Bearer ${firstToken}`)
      .send({ isTaken: true })
      .expect(200);
    await request(app)
      .post("/api/wishlist/add")
      .set("Authorization", `Bearer ${secondToken}`)
      .send({ giftId: firstGiftId })
      .expect(400);
    const availableAfterTaken = await request(app).get("/api/gifts").expect(200);
    expect(availableAfterTaken.body.gifts).to.have.length(0);

    const secondGift = await request(app)
      .post("/api/gifts/post-gift")
      .set("Authorization", `Bearer ${secondToken}`)
      .send({ ...gift, name: "Chair", contactInfo: "second@example.com" })
      .expect(201);
    secondGiftId = secondGift.body.gift._id;
  });

  it("adds, lists, de-duplicates, and removes wishlist entries", async () => {
    await request(app).get("/api/wishlist").expect(401);
    await request(app)
      .post("/api/wishlist/add")
      .set("Authorization", `Bearer ${firstToken}`)
      .send({ giftId: "invalid" })
      .expect(400);
    await request(app)
      .post("/api/wishlist/add")
      .set("Authorization", `Bearer ${secondToken}`)
      .send({ giftId: secondGiftId })
      .expect(400);
    await request(app)
      .post("/api/wishlist/add")
      .set("Authorization", `Bearer ${firstToken}`)
      .send({ giftId: secondGiftId })
      .expect(201);
    await request(app)
      .post("/api/wishlist/add")
      .set("Authorization", `Bearer ${firstToken}`)
      .send({ giftId: secondGiftId })
      .expect(200);
    const wishlist = await request(app)
      .get("/api/wishlist")
      .set("Authorization", `Bearer ${firstToken}`)
      .expect(200);
    expect(wishlist.body.gifts.map((gift) => gift._id)).to.include(secondGiftId);
    await request(app)
      .delete(`/api/wishlist/remove-from-wishlist/${secondGiftId}`)
      .set("Authorization", `Bearer ${firstToken}`)
      .expect(200);
    await request(app)
      .delete(`/api/wishlist/remove-from-wishlist/${secondGiftId}`)
      .set("Authorization", `Bearer ${firstToken}`)
      .expect(200);
  });

  it("enforces gift deletion ownership", async () => {
    await request(app)
      .delete(`/api/gifts/delete/${firstGiftId}`)
      .set("Authorization", `Bearer ${secondToken}`)
      .expect(403);
    await request(app)
      .delete(`/api/gifts/delete/${firstGiftId}`)
      .set("Authorization", `Bearer ${firstToken}`)
      .expect(200);
    await request(app)
      .delete(`/api/gifts/delete/${secondGiftId}`)
      .set("Authorization", `Bearer ${secondToken}`)
      .expect(200);
  });
});
