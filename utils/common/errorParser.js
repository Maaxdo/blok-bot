const { AxiosError } = require("axios");

const errorParser = (error) => {
  const DEFAULT_ERROR = "An error occured";

  if (error instanceof AxiosError) {
    if ("detail" in error.response?.data) {
      return error.response?.data?.detail || DEFAULT_ERROR;
    }

    return error.response?.data?.message || DEFAULT_ERROR;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }
  return DEFAULT_ERROR;
};

module.exports = { errorParser };
