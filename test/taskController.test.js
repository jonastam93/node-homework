require("dotenv").config();

process.env.DATABASE_URL = process.env.TEST_DATABASE_URL; // point to the test database

const prisma = require("../db/prisma");
const httpMocks = require("node-mocks-http");
const EventEmitter = require("events");

const {
  index,
  show,
  create,
  update,
  deleteTask,
} = require("../controllers/taskController");

const waitForRouteHandlerCompletion = require("./waitForRouteHandlerCompletion");

// a few usefull globals
let user1 = null;
let user2 = null;
let saveRes = null;
let saveData = null;
let saveTaskId = null;

beforeAll(async () => {
    await prisma.Task.deleteMany();
    await prisma.user.deleteMany();

    user1 = await prisma.User.create({
      data: {
        name: "Bob",
        email: "bob@sample.com",
        hashedPassword: "nonsense",
      },
    });

    user2 = await prisma.User.create({
      data: {
        name: "Alice",
        email: "alice@sample.com",
        hashedPassword: "nonsense"
      },
    });
});

afterAll(async () => {
    await prisma.$disconnect();
});

describe("testing task creation", () => {
  it("14. cant create a task without a user id", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { title: "first task" },
    });

    saveRes = httpMocks.createResponse({
      eventEmitter: EventEmitter,
    });

    expect.assertions(1);

    try {
      await waitForRouteHandlerCompletion(create, req, saveRes);
    } catch (e) {
      expect(e.name).toBe("TypeError");
    }
  });

  it("15. can't create a task with a bogus user id", async () => {
    const req = httpMocks.createRequest({
        method: "POST",
        body: { title: "first task" },
    });

    req.user = {
      id: user2.id + 999999,
    };

    const res = httpMocks.createResponse({
      eventEmitter: EventEmitter,
    });

    expect.assertions(1);

    try {
      await waitForRouteHandlerCompletion(create, req, res);
    } catch (e) {
      expect(e.name).toBe("PrismaClientKnownRequestError");
    }
  });

  it("16. creates a task with a valid user id", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { title: "first task" },
    });

    req.user = {
      id: user1.id,
    };

    saveRes = httpMocks.createResponse({
      eventEmitter: EventEmitter,
    });

    await waitForRouteHandlerCompletion(create, req, saveRes);

    expect(saveRes.statusCode).toBe(201);
  });

  it("17. returns the expected title", () => {
    saveData = saveRes._getJSONData();

    expect(saveData.title).toBe("first task");
  });

  it("18. has the correct isCompleted value", () => {
    expect(saveData.isCompleted).toBe(false);
  });

  it("19. does not return userId", () => {
    expect(saveData.userId).toBeUndefined();

    saveTaskId = saveData.id;
  });
});

describe("test getting created tasks", () => {
  it("20. can't get a list of tasks without a user id", async () => {
    const req = httpMocks.createRequest({
      method: "GET",
    });

    const res = httpMocks.createResponse({
      eventEmitter: EventEmitter,
    });

    expect.assertions(1);

    try {
      await waitForRouteHandlerCompletion(index, req, res);
    } catch (e) {
      expect(e.name).toBe("TypeError");
    }
  });

  it("21. If you use user1's id on index() the call returns a 200 status.", async () => {
    const req = httpMocks.createRequest({
      method: "GET",
    });

    req.user = {
      id: user1.id,
    };

    saveRes = httpMocks.createResponse({
      eventEmitter: EventEmitter,
    });

    await waitForRouteHandlerCompletion(index, req, saveRes);

    expect(saveRes.statusCode).toBe(200);
  });

  it("22. The returned object has a tasks array of length 1.", () => {
    saveData = saveRes._getJSONData();

    expect(saveData.tasks.length).toBe(1);
  });

  it("23. The first task has the expected title.", () => {
    expect(saveData.tasks[0].title).toBe("first task");
  });

  it("24. The first task does not contain userId.", () => {
    expect(saveData.tasks[0].userId).toBeUndefined();
  });

  it("25. user2 gets a 404 when retrieving the task list.", async () => {
    const req = httpMocks.createRequest({
      method: "GET",
    });

    req.user = {
      id: user2.id,
    };

    const res = httpMocks.createResponse({
      eventEmitter: EventEmitter,
    });

    await waitForRouteHandlerCompletion(index, req, res);

    expect(res.statusCode).toBe(404);
  });

  it("26. user1 can retrieve the created task using show().", async () => {
    const req = httpMocks.createRequest({
      method: "GET",
      params: {
        id: saveTaskId.toString(),
      },
    });

    req.user = {
      id: user1.id,
    };

    const res = httpMocks.createResponse({
      eventEmitter: EventEmitter,
    });

    await waitForRouteHandlerCompletion(show, req, res);

    expect(res.statusCode).toBe(200);
  });

  it("27. user2 can't retrieve user1's task.", async () => {
    const req = httpMocks.createRequest({
      method: "GET",
      params: {
        id: saveTaskId.toString(),
      },
    });

    req.user = {
      id: user2.id,
    };

    const res = httpMocks.createResponse({
      eventEmitter: EventEmitter,
    });

    await waitForRouteHandlerCompletion(show, req, res);

    expect(res.statusCode).toBe(404);
  });
});

describe("testing the update and delete of tasks", () => {
  it("28. user1 can set the task to isCompleted true.", async () => {
    const req = httpMocks.createRequest({
      method: "PATCH",
      params: {
        id: saveTaskId.toString(),
      },
      body: {
        isCompleted: true,
      },
    });

    req.user = {
      id: user1.id,
    };

    const res = httpMocks.createResponse({
      eventEmitter: EventEmitter,
    });

    await waitForRouteHandlerCompletion(update, req, res);

    expect(res.statusCode).toBe(200);

    const data = res._getJSONData();

    expect(data.isCompleted).toBe(true);
  });

  it("29. user2 can't update user1's task.", async () => {
    const req = httpMocks.createRequest({
      method: "PATCH",
      params: {
        id: saveTaskId.toString(),
      },
      body: {
        isCompleted: false,
      },
    });

    req.user = {
      id: user2.id,
    };

    const res = httpMocks.createResponse({
      eventEmitter: EventEmitter,
    });

    await waitForRouteHandlerCompletion(update, req, res);

    expect(res.statusCode).toBe(404);
  });

  it("30. user2 can't delete user1's task.", async () => {
    const req = httpMocks.createRequest({
      method: "DELETE",
      params: {
        id: saveTaskId.toString(),
      },
    });

    req.user = {
      id: user2.id,
    };

    const res = httpMocks.createResponse({
      eventEmitter: EventEmitter,
    });

    await waitForRouteHandlerCompletion(deleteTask, req, res);

    expect(res.statusCode).toBe(404);
  });

  it("31. user1 can delete the task.", async () => {
    const req = httpMocks.createRequest({
      method: "DELETE",
      params: {
        id: saveTaskId.toString(),
      },
    });

    req.user = {
      id: user1.id,
    };

    const res = httpMocks.createResponse({
      eventEmitter: EventEmitter,
    });

    await waitForRouteHandlerCompletion(deleteTask, req, res);

    expect(res.statusCode).toBe(200);
  });

  it("32. retrieving user1's tasks now returns a 404.", async () => {
    const req = httpMocks.createRequest({
      method: "GET",
    });

    req.user = {
      id: user1.id,
    };

    const res = httpMocks.createResponse({
      eventEmitter: EventEmitter,
    });

    await waitForRouteHandlerCompletion(index, req, res);

    expect(res.statusCode).toBe(404);
  });
});