const token = searchParams.get("token");

const onFinish = async ({ password }) => {
  try {
    const response = await resetPassword(token, password);
    message.success(response.message || "Password updated");
    navigate("/login", { replace: true });
  } catch (error) {
    message.error(error.response?.data?.message || "Reset failed");
  }
};
