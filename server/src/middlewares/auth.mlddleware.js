import jwt from "jsonwebtoken";
async function verifyJWT(req, res, next) {
  try {
    const token =
      req.cookies?.accessToken || req.headers?.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized access" });
    }
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    console.log("🔴decoded: ", decoded);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export { verifyJWT };
