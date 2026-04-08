const validate = {
  success: false,
  error: (ZodError = [
    {
      expected: "string",
      code: "invalid_type",
      path: ["userId"],
      message: "Invalid input: expected string, received undefined",
    },
  ]),
};
