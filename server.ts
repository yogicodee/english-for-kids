import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cors());

  // Mock Database
  const db = {
    users: [
      { id: "1", name: "Andi", xp: 1250, level: 5, badges: ["First Step", "Vocab Master"] },
      { id: "2", name: "Siti", xp: 980, level: 4, badges: ["Grammar Guru"] },
      { id: "3", name: "Budi", xp: 2100, level: 8, badges: ["Top 3", "Hard Worker"] },
      { id: "4", name: "Lina", xp: 450, level: 2, badges: [] },
    ],
    quests: [
      {
        id: "v1",
        title: "Magic Animals!",
        type: "vocabulary",
        difficulty: "Easy",
        xpAward: 50,
        questions: [
          { q: "This animal says 'Woof!'. What is it?", a: ["Cat", "Dog", "Bird"], correct: 1 },
          { q: "Which animal is very big and has a long trunk?", a: ["Mouse", "Rabbit", "Elephant"], correct: 2 },
        ]
      },
      {
        id: "g1",
        title: "Colorful Words",
        type: "grammar",
        difficulty: "Medium",
        xpAward: 80,
        questions: [
          { q: "The apple is ____. (Warna merah)", a: ["Red", "Blue", "Green"], correct: 0 },
          { q: "I have ____ cars. (Dua mobil)", a: ["one", "two", "three"], correct: 1 },
        ]
      },
      {
        id: "v2",
        title: "In the Classroom",
        type: "vocabulary",
        difficulty: "Easy",
        xpAward: 50,
        questions: [
          { q: "You read me to learn stories. What am I?", a: ["Pencil", "Book", "Eraser"], correct: 1 },
          { q: "I have four legs and you sit on me.", a: ["Table", "Chair", "Door"], correct: 1 },
        ]
      }
    ]
  };

  // API Routes
  app.get("/api/user/:id", (req, res) => {
    const user = db.users.find(u => u.id === req.params.id);
    if (user) res.json(user);
    else res.status(404).json({ error: "User not found" });
  });

  app.get("/api/leaderboard", (req, res) => {
    const sorted = [...db.users].sort((a, b) => b.xp - a.xp);
    res.json(sorted);
  });

  app.get("/api/quests", (req, res) => {
    res.json(db.quests);
  });

  app.post("/api/update-xp", (req, res) => {
    const { userId, xpToAdd } = req.body;
    const user = db.users.find(u => u.id === userId);
    if (user) {
      user.xp += xpToAdd;
      // Level up logic (every 500 XP)
      user.level = Math.floor(user.xp / 500) + 1;
      res.json(user);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
