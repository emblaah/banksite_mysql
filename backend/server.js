import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";

const app = express();
const PORT = 3001;
// Middleware
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  user: "root",
  password: "root",
  host: "localhost",
  database: "bank",
  port: 8889,
});

// Help function to make code look cleaner
async function query(sql, params) {
  const [results] = await pool.execute(sql, params);
  return results;
}

// Generera engångslösenord
function generateOTP() {
  // Generera en sexsiffrig numerisk OTP
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp.toString();
}

// Din kod här. Skriv dina arrayer
// const users = [];
// const accounts = [];
const sessions = [];

// Skapa användare
app.post("/users", async (req, res) => {
  const { username, password } = req.body;

  try {
    const sqlUser = "INSERT INTO users (username, password) VALUES (?, ?)";
    const params = [username, password];

    const userResult = await query(sqlUser, params);
    console.log("result users", userResult);

    // Get new user ID:
    const userId = userResult.insertId;

    const sqlAccount = "INSERT INTO accounts (userId, amount) VALUES (?, ?)";
    const paramsAccount = [userId, 0];
    const accountResult = await query(sqlAccount, paramsAccount);
    console.log("account result", accountResult);

    res.send("User and account created");
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: error.message });
  }
});

// Hitta användare baserat på användarnamn och lösenord
// function getUser(username, password) {
//   const user = users.find(
//     (user) => user.username === username && user.password === password
//   );
//   return user;
// }

// Logga in användare baserat på användarnamn och lösenord
app.post("/sessions", async (req, res) => {
  const { username, password } = req.body;

  try {
    const sql = "SELECT * FROM users WHERE username = ? AND password = ?";
    const params = [username, password];

    const result = await query(sql, params);
    console.log("session result", result);

    // Check if user exists
    if (result.length === 0) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const user = result[0];
    const token = generateOTP();

    // Save session
    const session = {
      userId: user.id,
      id: sessions.length + 1,
      token,
      username,
    };

    sessions.push(session);
    res.json(session);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get account balance/amount
app.post("/me/accounts", async (req, res) => {
  const { token } = req.body;

  const session = sessions.find((session) => session.token === token);
  console.log("session", session);

  if (session) {
    const { userId } = session;

    try {
      // prova select amount from accounts where userId = ? om inte funkar
      const sql = "SELECT * FROM accounts WHERE userId = ?";
      const params = [userId];

      const result = await query(sql, params);
      const account = result[0];

      console.log("session result", result);

      if (account) {
        res.json(account);
      } else {
        res.status(404).json({ error: "Account not found" });
      }
    } catch (error) {
      console.error("Error:", error);
      res.status(401).json({ error: error.message });
    }

    // if (result.length === 0) {
    //   return res.status(404).json({ error: "Account not found" });
    // }
    // const account = accounts.find((account) => account.userId === userId);
    // if (account) {
    //   res.json(account);
    // } else {
    //   return res.status(404).json({ message: "Account not found" });
    // }
  } else {
    res.status(401).json({ message: "Invalid session" });
  }
});

// app.post("/me/accounts/transactions/deposit", async (req, res) => {
//   const { depositAmount, token } = req.body;

//   const session = sessions.find((session) => session.token === token);
//   if (!session) {
//     return res.status(401).json({ message: "Session not found" });
//   }

//   try {
//     console.log("session", session);
//     const { userId } = session;

//     const sql = "UPDATE accounts SET amount = amount + ? WHERE userId = ?";
//     const params = [depositAmount, userId];
//     await query(sql, params);

//     res.json({ message: "Deposit successful" });

//     // if (account && session) {
//     //   account.amount += depositAmount;

//     //   console.log("account after added deposit", account);

//     //   res.json(account);
//     // } else {
//     //   res.status(404).send("Account not found");
//     // }
//   } catch (error) {
//     res.status(404).send("Session not found");
//   }

app.post("/me/accounts/transactions/deposit", async (req, res) => {
  const { depositAmount, token } = req.body;

  const session = sessions.find((session) => session.token === token);

  if (session) {
    try {
      const { userId } = session;
      const sql = "UPDATE accounts SET amount = amount + ? WHERE userId = ?";
      const params = [Number(depositAmount), userId];

      await query(sql, params);

      const accountSql = "SELECT * FROM accounts WHERE userId = ?";
      const accountParams = [userId];

      const result2 = await query(accountSql, accountParams);

      res.json(result2[0]); // Send updated account
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(404).send("Session not found");
  }
});

app.post("/me/accounts/transactions/withdraw", async (req, res) => {
  const { withdrawAmount, token } = req.body;

  const session = sessions.find((session) => session.token === token);

  if (session) {
    try {
      const { userId } = session;
      const sql = "UPDATE accounts SET amount = amount - ? WHERE userId = ?";
      const params = [Number(withdrawAmount), userId];

      await query(sql, params);

      // const account = result[0];
      const accountSql = "SELECT * FROM accounts WHERE userId = ?";
      const accountParams = [userId];

      const result2 = await query(accountSql, accountParams);

      res.json(result2[0]); // Send updated account
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(404).send("Session not found");
  }
});

// app.post("/me/accounts/transactions/withdraw", async (req, res) => {
//   const { withdrawAmount, token } = req.body;

//   const session = sessions.find((session) => session.token === token);
//   if (!session) {
//     return res.status(401).json({ message: "Session not found" });
//   }
//   try {
//     const sql = "UPDATE accounts SET amount = amount - ? WHERE userId = ?";
//     params = [withdrawAmount, session.userId];
//     await query(sql, params);
//   } catch (error) {
//     res.status(404).send("Session not found");
//   }

//   if (session) {
//     const userId = session.userId;
//     const account = accounts.find((account) => account.userId === userId);

//     if (account && session) {
//       if (account.amount < withdrawAmount) {
//         res.status(400).send("Insufficient funds");
//         return;
//       }
//       account.amount -= withdrawAmount;

//       res.json(account);
//     } else {
//       res.status(404).send("Account not found");
//     }
//   } else {
//     res.status(404).send("Session not found");
//   }
// });

// Starta servern
app.listen(PORT, () => {
  console.log(`Bankens backend körs på http://localhost:${PORT}`);
});
