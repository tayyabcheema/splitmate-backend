const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const app = express();
const cors = require("cors");
dotenv.config();
const PORT = process.env.PORT || 5000;
const errorHandler = require("./middleware/errorHandler");
const authRoutes = require("./routes/authRoutes");
const groupRoutes = require("./routes/groupRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const settlementRoutes = require("./routes/settlementRoutes");
const activityRoutes = require("./routes/activityRoutes");
const personalExpenseRoutes = require("./routes/personalExpenseRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

app.get("/", (req, res) => {
  res.send("Hello World");
});

corsOptions = {
  origin: ["http://localhost:3000"],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204,
}

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/settlements", settlementRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/personal-expenses", personalExpenseRoutes);
app.use("/api/notifications", notificationRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  connectDB();
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
