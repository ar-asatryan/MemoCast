module.exports = (req, res, next) => {
  res.json(req.headers);
}