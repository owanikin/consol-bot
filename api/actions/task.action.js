const taskService = require("../services/task.service");
const { NerManager } = require("node-nlp");

const entityManager = new NerManager({ threshold: 0.8 });

const taskAction = (req, res, next) => {
  const createTask = async (input, a) => {
    try {
      const { user, body } = req;
      const username = user.username || user.mobile_number;

      const taskToAdd = entityManager.addNamedEntity("taskToAdd", "trim");
      taskToAdd.addAfterCondition("en", "want to");
      taskToAdd.addAfterCondition("en", "i want to");
      taskToAdd.addAfterCondition("en", "i will");
      taskToAdd.addAfterCondition("en", "will");

      const entitiesResult = await entityManager.findEntities(body.Body, "en");
      const entities = await entitiesResult.reduce((x, current, i) => {
        x[current.entity] = !x[current.entity]
          ? current.utteranceText
          : x[current.entity];
        return x;
      }, []);

      if (!entities.taskToAdd)
        return "Didn't get that.\nKindly rephase e.g _I want to go shopping_";

      const task = entities.taskToAdd; //TODO: find an alternative to this
      const createdTask = await taskService().create({
        title: task,
        author: user.id,
        isDone: false
      });

      let response = `NOTED: _${createdTask.title}_\n Any other thing you want to do later?`;

      return response;
    } catch (error) {
      throw error;
    }
  };

  const deleteAllAuthorTasks = async (input, a) => {
    try {
      const { user, body } = req;
      const username = user.username || user.mobile_number;

      const createdTask = await taskService().deleteAllAuthorTasks(user.id);

      let response = `Your tasks have been cleared\n You currently have no tasks.\nYou can add new things to do any time you want.`;

      return response;
    } catch (error) {
      throw error;
    }
  };

  const deleteTask = async (input, a) => {
    try {
      const { user, body } = req;
      const username = user.username || user.mobile_number;

      const entitiesResult = await entityManager.findEntities(body.Body, "en");

      const entities = await entitiesResult.reduce((x, current, i) => {
        if (current.entity === "number")
          x[current.entity] = !x[current.entity]
            ? current.resolution.value
            : x[current.entity];
        return x;
      }, []);

      const tasks = await taskService().getByAuthor(user.id);
      const task = tasks[entities.number - 1];

      if (!task) return "Couldn't find the task";

      const deletedTask = await taskService().deleteOne({
        authorId: user.id,
        taskId: task.id
      });

      let response = `Your task _${task.title}_ has been deleted.\nYou can add new things to do any time you want.`;

      return response;
    } catch (error) {
      throw error;
    }
  };

  const completeTask = async (input, a) => {
    try {
      const { user, body } = req;
      const username = user.username || user.mobile_number;

      const entitiesResult = await entityManager.findEntities(body.Body, "en");

      const entities = await entitiesResult.reduce((x, current, i) => {
        if (current.entity === "number")
          x[current.entity] = !x[current.entity]
            ? current.resolution.value
            : x[current.entity];
        return x;
      }, []);

      const tasks = await taskService().getByAuthor(user.id);
      const task = tasks[entities.number - 1];

      if (!task) return "Couldn't find the task";

      const completedTask = await taskService().toggleCompletion({
        isDone: true,
        taskId: task.id
      });

      let response = `Your task _${task.title}_ ✅ has been checked as done.\n.`;

      return response;
    } catch (error) {
      throw error;
    }
  };

  return {
    createTask,
    deleteAllAuthorTasks,
    deleteTask,
    completeTask
  };
};

module.exports = taskAction;
