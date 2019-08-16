const { User } = require("../models");
const bcrypt = require("bcryptjs");
const jsonwebtoken = require("jsonwebtoken");
require("dotenv").config();

const errorHandler = error => {
  throw new Error(error);
};

const resolvers = {
  Query: {
    async allUsers(root, args, { user, errorName }) {
      if (!user) {
        errorHandler(errorName.UNAUTHORIZED);
      }
      return User.all();
    },
    async userById(root, { id }, { user, errorName }) {
      if (!user) {
        errorHandler(errorName.UNAUTHORIZED);
      }

      const userById = await User.findByPk(id);

      if (!userById) {
        errorHandler(errorName.NO_USER_WITH_THAT_ID);
      }

      return userById;
    },
    async currentUser(root, {}, { user, errorName }) {
      if (!user) {
        errorHandler(errorName.UNAUTHORIZED);
      }

      return user;
    }
  },

  Mutation: {
    async signup(
      root,
      { firstName, secondName, email, password },
      { errorName }
    ) {
      const userWithEmail = await User.findOne({ where: { email } });

      if (userWithEmail) {
        errorHandler(errorName.EMAIL_IS_ALREADY_REGISTERED);
      }

      const user = await User.create({
        firstName,
        secondName,
        email,
        password: await bcrypt.hash(password, 10)
      });

      if (!email.includes("@")) {
        errorHandler(errorName.INVALID_EMAIL);
      }

      return jsonwebtoken.sign(
        {
          id: user.id,
          email: user.email
        },
        process.env.JWT_SECRET,
        { expiresIn: "1y" }
      );
    },

    async login(root, { email, password }) {
      const user = await User.findOne({ where: { email } });

      if (!user) {
        errorHandler(errorName.NO_USER_WITH_THAT_EMAIL);
      }

      const valid = await bcrypt.compare(password, user.password);

      if (!valid) {
        errorHandler(errorName.INCORRECT_PASSWORD);
      }

      return {
        token: jsonwebtoken.sign(
          {
            id: user.id,
            email: user.email
          },
          process.env.JWT_SECRET,
          { expiresIn: "1y" }
        ),
        user
      };
    },

    async editUser(
      root,
      { id, email, firstName, secondName, password },
      { user, errorName }
    ) {
      if (!user) {
        errorHandler(errorName.UNAUTHORIZED);
      }

      if (!email.includes("@")) {
        errorHandler(errorName.INVALID_EMAIL);
      }

      const userById = await User.findByPk(id);

      if (!userById) {
        errorHandler(errorName.NO_USER_FOUND);
      }

      await userById.update({
        email,
        firstName,
        secondName,
        password: await bcrypt.hash(password, 10)
      });

      return userById;
    }
  }
};

module.exports = resolvers;
