const onFinish = async ({ firstName, lastName, email, password }) => {
  try {
    const response = await register(email, password, firstName, lastName);
    message.success(response.message || "Check your email to verify");
    navigate("/login", { replace: true });
  } catch (error) {
    message.error(error.response?.data?.message || "Register failed");
  }
};
