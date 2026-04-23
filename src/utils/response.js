export const ok = (res, data = null, message = "OK", status = 200) =>
  res.status(status).json({
    success: true,
    message,
    data,
  });

export const fail = (res, message = "Request failed", errors = null, status = 400) =>
  res.status(status).json({
    success: false,
    message,
    errors,
  });
