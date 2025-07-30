const createSuccess = (status, message, data) => {
  const res = new Error();
  res.status = status;
  res.message = message;
  res.success = true;
  res.data = data;
  return res;
};

module.exports = createSuccess;
