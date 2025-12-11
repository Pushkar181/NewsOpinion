exports.success = (res, data, message = "Success") => {
    return res.status(200).json({ message, data });
};

exports.error = (res, error, status = 400) => {
    return res.status(status).json({ error });
}; 