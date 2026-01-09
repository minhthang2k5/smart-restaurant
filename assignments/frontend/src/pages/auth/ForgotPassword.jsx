const onFinish = async ({ email }) => {
  try {
    const response = await forgotPassword(email);
    message.success(response.message || "Email sent");
  } catch (error) {
    message.error(error.response?.data?.message || "Request failed");
  }
};
