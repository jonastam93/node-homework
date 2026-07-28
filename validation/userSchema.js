const Joi = require("joi");

const weakPasswords = [
    "password",
    "12345678",
    "123456789",
    "qwerty",
    "letmein",
    "admin",
    "welcome",

];

const userSchema = Joi.object({
    email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .required(),

    name: Joi.string()
    .trim()
    .min(3)
    .max(30)
    .required(),

    password: Joi.string()
    .min(8)
    .required()
    .custom((value, helpers) => {
        if (weakPasswords.includes(value.toLowerCase())) {
            return helpers.error("any.invalid");
        }
        return value;
    }, "non-trivial password"),
});

module.exports = { userSchema };