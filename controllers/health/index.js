const {
  successResponse,
  failedResponse,
} = require("../../helpers/common/httpResponse");
const { connectToDB } = require("../../db/init");

const healthCheckerController = async (req, res) => {
  try {
    await connectToDB();
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
