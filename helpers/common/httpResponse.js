const { errorParser } = require("../../utils/common/errorParser");

const successResponse = ({
  res,
  message = null,
  status = 200,
  data = null,
}) => {
  return res.status(status).json({
    message,
    status: "okay",
    data,
  });
};

const failedResponse = ({ res, message = null, status = 500, err }) => {
  return res.status(status).json({
    message,
    error: errorParser(err),
    status: "failed",
  });
};

module.exports = { successResponse, failedResponse };
