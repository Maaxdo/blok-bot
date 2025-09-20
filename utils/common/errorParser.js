const { AxiosError } = require("axios");

const errorParser = (error) => {
  const DEFAULT_ERROR = "An error occurred";

  if (error instanceof AxiosError) {
    if ("detail" in error.response?.data) {
      return error.response?.data?.detail || DEFAULT_ERROR;
    }

    if (
      "message" in (typeof error.response?.data) &&
      typeof error.response?.data?.message === "string"
    ) {
      return error.response?.data?.message;
    }

    return DEFAULT_ERROR;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }
  return DEFAULT_ERROR;
};

const zodErrorParser = (validator) => {
  return validator.error.errors.map((e) => e.message).join("\n");
};

module.exports = { errorParser, zodErrorParser };
