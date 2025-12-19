const qrService = require("./../services/qrService");

exports.verifyAndGetMenu = async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({
                status: "fail",
                message: "Token is required",
            });
        }

        // Use the service to verify the token and get the table
        const table = await qrService.verifyQrToken(token);

        // If successful, respond with table info.
        // In the future, you would also fetch and send menu items here.
        res.status(200).json({
            status: "success",
            data: {
                table: {
                    id: table.id,
                    table_number: table.tableNumber,
                    location: table.location,
                },
                // menuItems: [...] // Add menu items later
            },
        });
    } catch (err) {
        // jwt.verify throws specific errors
        if (
            err.name === "TokenExpiredError" ||
            err.name === "JsonWebTokenError"
        ) {
            return res.status(401).json({
                status: "fail",
                message:
                    "This QR code is invalid or has expired. Please ask staff for assistance.",
            });
        }

        // Handle other errors (e.g., our custom error from the service)
        res.status(401).json({
            status: "fail",
            message: err.message,
        });
    }
};
