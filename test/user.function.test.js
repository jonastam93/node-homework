require("dotenv").config();
const request = require("supertest");

process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

const prisma = require("../db/prisma");
let agent;
let saveRes;
let csrfToken;
const { app, server } = require("../app");

beforeAll(async () => {
  // clear database
  await prisma.Task.deleteMany(); // delete all tasks
  await prisma.user.deleteMany(); // delete all users
  // Create a Supertest agent that preserves cookies
  agent = request.agent(app);
});

afterAll(async () => {
  await prisma.$disconnect();
  server.close();
});

describe("register a user", () => {
  let saveRes = null; // we'll declare this out here, so that we can reference it in several tests
  it("46. it creates the user entry", async () => {
    const newUser = {
      name: "John Deere",
      email: "jdeere@example.com",
      password: "Pa$$word20",
    };
    saveRes = await agent
       .post("/user/register")
       .set("X-Recaptcha-Test", process.env.RECAPTCHA_BYPASS)
       .send(newUser);
    
    expect(saveRes.status).toBe(201);
  });

  it("47. registration returns the expected name", () => {
    expect(saveRes.body.user.name).toBe("John Deere");
  });

  it("48. registration returns a csrfToken", () => {
    expect(saveRes.body.csrfToken).toBeDefined();

    csrfToken = saveRes.body.csrfToken;
  });
});

describe("login and logout", () => {
  it("49. can logon as the newly registered user", async () => {
    saveRes = await agent
      .post("/user/logon")
      .send({
        email: "jdeere@example.com",
        password: "Pa$$word20",
      });

    expect(saveRes.status).toBe(200);
  });

  it("50. /api/tasks returns 200 when logged in", async () => {
    saveRes = await agent.get("/api/tasks");

    expect(saveRes.status).toBe(200);
  });

  it("51. can log out", async () => {
    saveRes = await agent
      .post("/user/logoff")
      .set("X-CSRF-TOKEN", csrfToken);

    expect(saveRes.status).toBe(200);
  });

  it("52. /api/tasks returns a 401 after logout", async () => {
    saveRes = await agent.get("/api/tasks");

    expect(saveRes.status).toBe(401);
  });
});