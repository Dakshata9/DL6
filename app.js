const express = require("express");
let csrf = require("tiny-csrf");
const app = express();
const { Todo } = require("./models");
const bodyParser = require("body-parser");
const path = require("path");
let cookieParser = require("cookie-parser");

const todo = require("./models/todo");
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("shh! some secret string"));
app.use(csrf("this_should_be_32_charactes_long", ["PUT", "POST", "DELETE"]));
app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");

app.get("/", async (request, response) => {
  
  const overdue = await Todo.overdue();
  const dueLater = await Todo.dueLater();
  const dueToday = await Todo.dueToday();
  const completedItems = await Todo.getcompletedTodos();
  if (request.accepts("html")) {
    response.render("index", {
     
      overdue,
      dueToday,
      dueLater,
      completedItems,
      csrfToken: request.csrfToken(),
    });
  } else {
    response.json({ overdue, dueToday, dueLater,completedItems });
  }
});


app.get("/todos", async function (_request, response) {
  console.log("Processing list of all Todos ...");
  try {
    const todos = await Todo.findAll();
    return response.send(todos);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.get("/todos/:id", async function (request, response) {
  try {
    const todo = await Todo.findByPk(request.params.id);
    return response.json(todo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.post("/todos", async function (request, response) {
  console.log("creating new todo", request.body);
  try {
    const todo = await Todo.addTodo(request.body);
    return response.json(todo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.put("/todos/:id", async function (request, response) {
  console.log("Mark Todo as completed:", request.params.id);
  const todo = await Todo.findByPk(request.params.id);
  try {
    const updatedTodo = await todo.setCompletionStatus();
    return response.json(updatedTodo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.delete("/todos/:id", async (request, response) => {
  console.log("delete a todo with ID:", request.params.id);
   if (todo) {
    try {
      const deletedTodo = await todo.deleteTodo();

      return response.send(deletedTodo ? true : false);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  } else return response.send(false);
});

module.exports = app;
