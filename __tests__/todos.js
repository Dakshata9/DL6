const request = require("supertest");
let cheerio = require("cheerio");
const db = require("../models/index");
const app = require("../app");

let server, agent;
const extractCsrfToken = (resl) => {
  var $ = cheerio.load(resl.text);
  return $("[name = _csrf]").val();
};

afterAll(async () => {
    try {
      await db.sequelize.close();
      await server.close();
    } catch (error) {
      console.log(error);
    }
  });

describe("Todo Application", function () {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(3000, () => {});
    agent = request.agent(server);
  });

  
  test("Creates a todo and responds with json at /todos POST endpoint", async () => {
    const resl = await agent.get("/");
    const csrfToken = extractCsrfToken(res);
    const response = await agent.post("/todos").send({
      title: "Buy milkk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(200);
    expect(response.header["content-type"]).toBe(
      "application/json; charset=utf-8"
    );
    const parsedResponse = JSON.parse(response.text);
    expect(parsedResponse.id).toBeDefined();
  });

  test("Marks a todo with the given ID as complete", async () => {
    let resl = await agent.get("/");
    let csrfToken = extractCsrfToken(resl);
    await agent.post("/todos").send({
      title: "Buy milkk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    
    const groupedTodosResponse = await agent
      .get("/")
      .set("Accept", "application/json");
    
   const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    
    const dueTodayCount = parsedGroupedResponse.dueTodayItems.length;
    const lTodo = parsedGroupedResponse.dueTodayItems[dueTodayCount - 1];

    resl = await agent.get("/");
    csrfToken = extractCsrfToken(resl);

    const markCompleteResponse = await agent
      .put(`/todos/${lTodo.id}/markASCompleted`)
      .send();
    const parsedUpdateResponse = JSON.parse(markCompleteResponse.text);
    expect(parsedUpdateResponse.completed).toBe(true);
  });
  test("Mark todo as incomplete (Updating Todo)", async () => {
    let resl = await agent.get("/");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Buy Choclate",
      dueDate: new Date().toISOString(),
      completed: true,
      _csrf: csrfToken,
    });

    const groupedTodosResponse = await agent
      .get("/")
      .set("Accept", "application/json");
    
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    
    const completedItemsCount = parsedGroupedResponse.completedItems.length;
   
    const lTodo =
      parsedGroupedResponse.completedItems[completedItemsCount - 1];
    const completedStatus = !lTodo.completed;
    resl = await agent.get("/");
    csrfToken = extractCsrfToken(resl);

    const markCompleteResponse = await agent
      .put(`/todos/${lTodo.id}`)
      .send({
        _csrf: csrfToken,
        completed: completedStatus,
      });

    const parsedUpdateResponse = JSON.parse(markCompleteResponse.text);
    expect(parsedUpdateResponse.completed).toBe(false);
  });


  test("Fetches all todos in the database using /todos endpoint", async () => {
    let resl = await agent.get("/");
    let csrfToken = extractCsrfToken(resl);
    await agent.post("/todos").send({
      title: "Buy xbox",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    resl = await agent.get("/");
    csrfToken = extractCsrfToken(resl);
    await agent.post("/todos").send({
      title: "Buy ps3",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    const response = await agent.get("/todos");
    const parsedResponse = JSON.parse(response.text);

    expect(parsedResponse.length).toBe(4);
    expect(parsedResponse[3]["title"]).toBe("Buy ps3");
  });

  test("Delete todo using ID", async () => {
    let resl = await agent.get("/");
    let csrfToken = extractCsrfToken(resl);
    await agent.post("/todos").send({
      title: "Delete todo",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    const groupedTodosResponse = await agent
      .get("/")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    const dueTodayCount = parsedGroupedResponse.dueTodayItems.length;
    const lTodo = parsedGroupedResponse.dueTodayItems[dueTodayCount - 1];

    resl = await agent.get("/");
    csrfToken = extractCsrfToken(resl);

    const deletedResponse = await agent
      .delete(`/todos/${lTodo.id}`)
      .send({ _csrf: csrfToken });
    const parsedDeletedResponse = JSON.parse(deletedResponse.text);

    expect(parsedDeletedResponse).toBe(true);
  });
});
