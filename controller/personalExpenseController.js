const PersonalExpense = require("../models/PersonalExpense");
const createError = require("../utils/error");
const successResponse = require("../utils/response");
const { Parser } = require("json2csv");

const addPersonalExpense = async (req, res, next) => {
  try {
    const { amount, description, category, notes, currency, date, method } =
      req.body;

    if (!amount || !description || !category || !method) {
      return next(
        createError(400, "Amount, description, and category are required")
      );
    }

    const expense = await PersonalExpense.create({
      user: req.user._id,
      amount,
      description,
      category,
      notes,
      currency,
      date,
      method,
    });

    return next(
      successResponse(201, "Personal expense added successfully", expense)
    );
  } catch (err) {
    return next(createError(500, err.message));
  }
};

const getPersonalExpenses = async (req, res, next) => {
  try {
    const { startDate, endDate, category } = req.query;
    const filter = { user: req.user._id };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    if (category) {
      filter.category = category;
    }

    const expenses = await PersonalExpense.find(filter).sort({ date: -1 });

    return next(
      successResponse(200, "Personal expenses retrieved successfully", expenses)
    );
  } catch (err) {
    return next(createError(500, err.message));
  }
};

const updatePersonalExpense = async (req, res, next) => {
  try {
    const expenseId = req.params.id;
    const expense = await PersonalExpense.findOne({
      _id: expenseId,
      user: req.user._id,
    });

    if (!expense) {
      return next(createError(404, "Personal expense not found"));
    }

    Object.assign(expense, req.body);
    await expense.save();

    return next(
      successResponse(200, "Personal expense updated successfully", expense)
    );
  } catch (err) {
    return next(createError(500, err.message));
  }
};

const deletePersonalExpense = async (req, res, next) => {
  try {
    const expenseId = req.params.id;
    const deleted = await PersonalExpense.findOneAndDelete({
      _id: expenseId,
      user: req.user._id,
    });

    if (!deleted) {
      return next(createError(404, "Personal expense not found"));
    }

    return next(
      successResponse(200, "Personal expense deleted successfully", deleted)
    );
  } catch (err) {
    return next(createError(500, err.message));
  }
};

const exportPersonalExpensesCSV = async (req, res, next) => {
  try {
    const expenses = await PersonalExpense.find({ user: req.user._id }).lean();

    if (!expenses || expenses.length === 0) {
      return next(createError(404, "No personal expenses found to export"));
    }

    const fields = [
      { label: "Date", value: "date" },
      { label: "Amount", value: "amount" },
      { label: "Category", value: "category" },
      { label: "Description", value: "description" },
      { label: "Currency", value: "currency" },
      { label: "Method", value: "method" },
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(expenses);

    res.header("Content-Type", "text/csv");
    res.attachment("personal-expenses.csv");
    return res.send(csv);
  } catch (err) {
    return next(createError(500, err.message));
  }
};

module.exports = {
  addPersonalExpense,
  getPersonalExpenses,
  updatePersonalExpense,
  deletePersonalExpense,
  exportPersonalExpensesCSV,
};
