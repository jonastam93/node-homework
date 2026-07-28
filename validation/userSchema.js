const Joi = require("joi");

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
        if (value.toLowerCase() === "password") {
            return helpers.error("any.invalid");
        }
        return value;
    }, "non-trivial password"),
});

module.exports = { userSchema };