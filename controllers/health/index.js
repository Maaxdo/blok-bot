const { successResponse } = require("../../helpers/common/httpResponse");

const healthCheckerController = (req, res) => {
  return successResponse({
    res,
    data: {
      status: "UP",
    },
    message: "Health check passed",
  });
};

module.exports = { healthCheckerController };
