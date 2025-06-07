const User = require("./models/User");
app.use(express.json());

app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    const userExists = await User.findOne({ username });
    if (userExists) return res.status(400).json({ error: "Ім'я вже зайняте" });

    const newUser = new User({ username, password }); // password пізніше хешувати
    await newUser.save();
    res.status(201).json({ message: "Реєстрація успішна" });
  } catch (err) {
    res.status(500).json({ error: "Помилка реєстрації" });
  }
});
