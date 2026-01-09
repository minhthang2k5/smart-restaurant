const onFinish = async ({ email, password }) => {
  try {
    const response = await login(email, password);
    message.success(response.message || "Login successful");
    const role = response.data.user.role;
    const target = role === "admin" ? "/admin/tables" : "/menu";
    navigate(target, { replace: true });
  } catch (error) {
    message.error(error.response?.data?.message || "Login failed");
  }
};
