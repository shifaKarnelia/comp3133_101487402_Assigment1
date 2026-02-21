const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Employee = require("../models/Employee");
const cloudinary = require("cloudinary").v2;

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function requireAuth(user) {
  if (!user) return false;
  return true;
}

async function maybeUploadToCloudinary(employee_photo) {
  // If already a URL, keep it
  if (!employee_photo) return null;
  if (employee_photo.startsWith("http")) return employee_photo;

  // If base64 or something else, upload
  const result = await cloudinary.uploader.upload(employee_photo, { folder: "comp3133_employees" });
  return result.secure_url;
}

const resolvers = {
  Query: {
    login: async (_, { input }) => {
      const { usernameOrEmail, password } = input;

      if (!usernameOrEmail || !password) {
        return { success: false, message: "username/email and password are required", token: null, user: null };
      }

      const user = await User.findOne({
        $or: [{ username: usernameOrEmail }, { email: usernameOrEmail.toLowerCase() }]
      });

      if (!user) return { success: false, message: "Invalid credentials", token: null, user: null };

      const ok = await bcrypt.compare(password, user.password);
      if (!ok) return { success: false, message: "Invalid credentials", token: null, user: null };

      const token = jwt.sign(
        { _id: user._id, username: user.username, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "2h" }
      );

      return { success: true, message: "Login successful", token, user };
    },

    getAllEmployees: async (_, __, { user }) => {
      if (!requireAuth(user)) return { success: false, message: "Unauthorized", employees: [] };
      const employees = await Employee.find().sort({ created_at: -1 });
      return { success: true, message: "Employees fetched", employees };
    },

    getEmployeeByEid: async (_, { eid }, { user }) => {
      if (!requireAuth(user)) return { success: false, message: "Unauthorized", employee: null };

      const employee = await Employee.findById(eid);
      if (!employee) return { success: false, message: "Employee not found", employee: null };

      return { success: true, message: "Employee found", employee };
    },

    searchEmployees: async (_, { designation, department }, { user }) => {
      if (!requireAuth(user)) return { success: false, message: "Unauthorized", employees: [] };

      const filter = {};
      if (designation) filter.designation = new RegExp(designation, "i");
      if (department) filter.department = new RegExp(department, "i");

      const employees = await Employee.find(filter);
      return { success: true, message: "Search results", employees };
    }
  },

  Mutation: {
    signup: async (_, { input }) => {
      const { username, email, password } = input;

      if (!username || !email || !password) {
        return { success: false, message: "username, email, password are required", token: null, user: null };
      }
      if (!validateEmail(email)) return { success: false, message: "Invalid email format", token: null, user: null };
      if (password.length < 6) return { success: false, message: "Password must be at least 6 chars", token: null, user: null };

      const exists = await User.findOne({ $or: [{ username }, { email: email.toLowerCase() }] });
      if (exists) return { success: false, message: "User already exists", token: null, user: null };

      const hashed = await bcrypt.hash(password, 10);
      const user = await User.create({ username, email: email.toLowerCase(), password: hashed });

      const token = jwt.sign(
        { _id: user._id, username: user.username, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "2h" }
      );

      return { success: true, message: "Signup successful", token, user };
    },

    addEmployee: async (_, { input }, { user }) => {
      if (!requireAuth(user)) return { success: false, message: "Unauthorized", employee: null };

      const required = ["first_name", "last_name", "email", "designation", "salary", "date_of_joining", "department"];
      for (const f of required) {
        if (input[f] === undefined || input[f] === null || input[f] === "") {
          return { success: false, message: `${f} is required`, employee: null };
        }
      }
      if (!validateEmail(input.email)) return { success: false, message: "Invalid email", employee: null };
      if (Number(input.salary) < 1000) return { success: false, message: "Salary must be >= 1000", employee: null };

      try {
        const photoUrl = await maybeUploadToCloudinary(input.employee_photo);
        const employee = await Employee.create({ ...input, employee_photo: photoUrl });
        return { success: true, message: "Employee created", employee };
      } catch (e) {
        if (e.code === 11000) return { success: false, message: "Employee email must be unique", employee: null };
        throw e;
      }
    },

    updateEmployee: async (_, { eid, input }, { user }) => {
      if (!requireAuth(user)) return { success: false, message: "Unauthorized", employee: null };

      if (input.email && !validateEmail(input.email)) {
        return { success: false, message: "Invalid email", employee: null };
      }
      if (input.salary !== undefined && Number(input.salary) < 1000) {
        return { success: false, message: "Salary must be >= 1000", employee: null };
      }

      if (input.employee_photo) {
        input.employee_photo = await maybeUploadToCloudinary(input.employee_photo);
      }

      try {
        const employee = await Employee.findByIdAndUpdate(eid, input, { new: true });
        if (!employee) return { success: false, message: "Employee not found", employee: null };
        return { success: true, message: "Employee updated", employee };
      } catch (e) {
        if (e.code === 11000) return { success: false, message: "Employee email must be unique", employee: null };
        throw e;
      }
    },

    deleteEmployee: async (_, { eid }, { user }) => {
      if (!requireAuth(user)) return { success: false, message: "Unauthorized" };

      const employee = await Employee.findByIdAndDelete(eid);
      if (!employee) return { success: false, message: "Employee not found" };

      return { success: true, message: "Employee deleted" };
    }
  }
};

module.exports = resolvers;