import { User } from "../models/user.model.js";

const registerUser = async (req, res) => {
  const { fullName, email, password } = req.body;
  if (!fullName || !email || !password) {
    res.status(500).json({
      status: 500,
      message: "please provide all the required details",
      error: "data not provided",
    });
    return;
  }

  try {
    const user = await User.create({
      fullName,
      email,
      password,
    });

    if (!user) {
      res.status(500).json({
        status: 500,
        message: "something went wrong while writing to db",
        error: "unable to write to db",
      });
      return;
    }
    console.log("🔴 user: ", user);
    res.status(200).json({
      status: 200,
      message: "User created successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
      error: "unable to create user",
    });
  }
};

export { registerUser };
