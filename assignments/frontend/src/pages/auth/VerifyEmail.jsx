const token = searchParams.get("token");

useEffect(() => {
  if (!token) {
    setStatus("error");
    return;
  }
  verifyEmail(token)
    .then((response) => {
      const role = response.data.user.role;
      const target = role === "admin" ? "/admin/tables" : "/menu";
      setStatus("success");
      setTimeout(() => navigate(target, { replace: true }), 1200);
    })
    .catch(() => setStatus("error"));
}, [token, verifyEmail, navigate]);
