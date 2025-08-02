const {
  successResponse,
  failedResponse,
} = require("../../helpers/common/httpResponse");
const healthCheckerController = async (req, res) => {
  try {
    return successResponse({
      res,
      data: {
        status: "UP",
      },
      message: "Health check passed",
    });
  } catch (error) {
    return failedResponse({
      res,
      message: error.message,
      status: 500,
      err: error,
    });
  }
};

module.exports = { healthCheckerController };
