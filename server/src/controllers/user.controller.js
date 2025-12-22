import { User } from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

async function generateRefresAndAccessToken(user) {
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save();

  return { accessToken, refreshToken };
}

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
    const existingUser = await User.findOne({
      // $or: [{ fullName }, { email }],
      email,
    });

    if (existingUser) {
      res.status(409).json({
        status: 409,
        message: "User already exists, please register with new email",
        error: "User already exist",
      });
      return;
    }

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

    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    console.log("🔴 user: ", user);
    res.status(201).json({
      status: 201,
      message: "User created successfully",
      data: createdUser,
    });
  } catch (error) {
    console.log("error: ", error);
    res.status(500).json({
      status: 500,
      message: error.message,
      error: "unable to create user",
    });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email && !password) {
    res.status(500).json({
      status: 500,
      message: "please enter username/email and password",
      error: "data not provided for login",
    });
    return;
  }

  try {
    const user = await User.findOne({
      // $or: [{ username }, { email }],
      email,
    });

    if (!user) {
      res.status(500).json({
        status: 500,
        message: "No user found, please sign up",
        error: "Unable to login user",
      });
      return;
    }

    const isValidPassword = user.isPasswordCorrect(password);
    if (!isValidPassword) {
      res.status(500).json({
        status: 500,
        message: "Password is wrong, please enter correct password",
        error: "Unable to login user",
      });
      return;
    }
    const { refreshToken, accessToken } = await generateRefresAndAccessToken(
      user
    );

    const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );
    const options = {
      httpOnly: true,

      secure: true,
    };

    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json({
        message: "user logged in successfully",
        response: 200,
        data: {
          loggedInUser,
          refreshToken,
          accessToken,
        },
      });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
      error: "unable to create user",
    });
  }
};

export { registerUser, loginUser };
