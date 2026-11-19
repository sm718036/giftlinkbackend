const PG_ERRORS = {
  "23505": {
    status: 409,
    message: "That record already exists. Please use different details.",
  },
  "23503": {
    status: 400,
    message: "This request refers to something that no longer exists.",
  },
  "23502": {
    status: 400,
    message: "A required field is missing. Please complete all required details.",
  },
  "22P02": {
    status: 400,
    message: "One of the provided values has an invalid format.",
  },
};

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `We couldn't find ${req.method} ${req.originalUrl}. Please check the address and try again.`,
  });
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (error, req, res, next) => {
  if (res.headersSent) return next(error);

  console.error(
    `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} failed:`,
    error.message
  );

  if (error.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "The request body is not valid JSON. Please check the data you sent.",
    });
  }

  if (error.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: "The request is too large. Please upload a smaller image and try again.",
    });
  }

  const knownPgError = PG_ERRORS[error.code];
  if (knownPgError) {
    return res
      .status(knownPgError.status)
      .json({ success: false, message: knownPgError.message });
  }

  return res.status(500).json({
    success: false,
    message:
      "Something went wrong on our side. Please try again in a few moments.",
  });
};
