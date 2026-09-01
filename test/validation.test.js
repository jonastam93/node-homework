const { userSchema } = require("../validation/userSchema");
const {
    taskSchema,
    patchTaskSchema,
} = require("../validation/taskSchema");

describe("user object validation tests", () => {
    it("1. doesn't permit a trivial password", () => {
      const { error } = userSchema.validate(
        { name:"Bob", email: "bob@sample.com", password: "password" },
        { abortEarly: false },
      );

      expect(
        error.details.find((detail) => detail.context.key == "password"),
      ).toBeDefined();
    });

    it("2. requires an email", () => {
      const { error } = userSchema.validate(
        { name: "Bob", password: "StrongPassword123!" },
        { abortEarly: false },
      );

      expect(
        error.details.find((detail) => detail.context.key == "email"),
      ).toBeDefined();
    });

    it("3. doesn't accept an invalid email", () => {
      const { error } = userSchema.validate(
        { name: "Bob", email: "not-an-email", password: "StrongPassword123!" },
        { abortEarly: false },
      );

      expect(
        error.details.find((detail) => detail.context.key == "email"),
      ).toBeDefined();
    });

    it("4. requires a password", () => {
      const { error } = userSchema.validate(
        { name: "Bob", email: "bob@sample.com" },
        { abortEarly: false },
      );

      expect(
        error.details.find((detail) => detail.context.key == "password"),
      ).toBeDefined();
    });

    it("5. requires a name", () => {
      const { error } = userSchema.validate(
        { email: "bob@sample.com", password: "StrongPassword123!" },
        { abortEarly: false },
      );

      expect(
        error.details.find((detail) => detail.context.key == "name"),
      ).toBeDefined();
    });

    it("6. requires a valid name between 3 and 30 characters", () => {
      const { error } = userSchema.validate(
        { name: "Bo", email: "bob@sample.com", password: "StrongPassword123!" },
        { abortEarly: false },
      );

      expect(
        error.details.find((detail) => detail.context.key == "name"),
      ).toBeDefined();
    });

    it("7. returns no error for a valid user object", () => {
      const { error } = userSchema.validate(
        { name: "Bob", email: "bob@sample.com", password: "StrongPassword123!" },
      );

      expect(error).toBeFalsy();
    });
});

describe("task object validation tests", () => {
    it("8. requires a title", () => {
      const { error } = taskSchema.validate(
        { isCompleted: false },
        { abortEarly: false },
      );

      expect(
        error.details.find((detail) => detail.context.key == "title"),
      ).toBeDefined();
    });

    it("9. requires isCompleted to be valid when specified", () => {
      const { error } = taskSchema.validate(
        { title: "Test task", isCompleted: "not-a-boolean" },
        { abortEarly: false },
      );

      expect(
        error.details.find((detail) => detail.context.key == "isCompleted"),
      ).toBeDefined();
    });

    it("10. defaults isCompleted to false when not specified", () => {
      const { value } = taskSchema.validate({
        title: "Test task",
      });

      expect(value.isCompleted).toBe(false);
    });

    it("11. keeps isCompleted true when true is provided", () => {
      const { value } = taskSchema.validate({
        title: "Test task",
        isCompleted: true,
      });

      expect(value.isCompleted).toBe(true);
    });
});

describe("patch task object validation tests", () => {
    it("12. doesn't require a title", () => {
      const { value } = patchTaskSchema.validate({
        isCompleted: true,
      });

      expect(value.isCompleted).toBe(true);
    });

    it("13. leaves isCompleted undefined when it isn't provided", () => {
      const { value } = patchTaskSchema.validate({
        title: "Updated title",
      });

      expect(value.isCompleted).toBeUndefined();
    });
});