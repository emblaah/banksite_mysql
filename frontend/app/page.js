"use client";
import { useState, useRef, useEffect } from "react";
import Header from "./components/Header";

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [accountDetails, setAccountDetails] = useState({
    createdUsername: "",
    createdPassword: "",
  });

  // deposit, withdrawal, balance states
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");

  const loginButtonRef = useRef(null);
  const loginFormRef = useRef(null);

  const localhostURL = "localhost";
  const BASEURL = "ec2-13-60-186-122.eu-north-1.compute.amazonaws.com";

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUsername = localStorage.getItem("username");
    const savedBalance = localStorage.getItem("balance");

    console.log("Loaded from localStorage:", {
      savedToken,
      savedUsername,
      savedBalance,
    });

    if (savedToken && savedUsername) {
      setToken(savedToken);
      setUsername(savedUsername);
      setLoggedIn(true);
    }

    if (savedBalance) {
      setBalance(parseFloat(savedBalance));
    }
  }, []);

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    const newUser = { username, password };

    try {
      const response = await fetch(`http://${localhostURL}:3001/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      });

      const data = await response.json();
      console.log("create account data:", data);

      if (!response.ok) {
        alert("Failed to create account: " + data.message);
        throw new Error("Failed to create user");
      }

      alert("Account created successfully");
      console.log("created user", newUser);
      setAccountDetails({
        createdUsername: username,
        createdPassword: password,
      });
      setUsername("");
      setPassword("");
      if (loginButtonRef.current) {
        loginButtonRef.current.focus();
      }
    } catch (error) {
      console.log("Error creating user", error);
    }
  };

  const handleLogout = () => {
    // Clear localStorage and reset state
    localStorage.removeItem("token");
    localStorage.removeItem("balance");
    localStorage.removeItem("username");
    console.log("Cleared localStorage");

    setLoggedIn(false);
    setToken("");
    setBalance(0);
    setUsername("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://${localhostURL}:3001/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: accountDetails.createdUsername,
          password: accountDetails.createdPassword,
        }),
      });
      console.log("response in login:", response);
      const data = await response.json();
      console.log("Login Reponse sessions:", data);

      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", accountDetails.createdUsername);
        // Om inloggning lyckades
        setToken(data.token);
        setUsername(accountDetails.createdUsername);
        setLoggedIn(true);
        fetchAccount(data.token);
      } else {
        // Om inloggning misslyckades
        alert("Invalid login");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occured while logging in");
    }
  };

  const fetchAccount = async (token) => {
    try {
      const response = await fetch(`http://${localhostURL}:3001/me/accounts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });
      const data = await response.json();

      console.log("response.ok " + response.ok);
      if (!response.ok) {
        throw new Error(`HTTP error! status ${response.status}`);
      }

      console.log("Response Data:", data);
      setBalance(data.amount);

      localStorage.setItem("balance", data.amount);
    } catch (error) {
      console.error("Error fetching account:", error);
    }
  };

  const handleDepositTransaction = async (transactionType) => {
    fetchAccount(token); // Fetch account to get the latest balance
    const transactionAmount = parseFloat(amount);

    if (isNaN(transactionAmount) || transactionAmount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    try {
      console.log("start");

      const token = localStorage.getItem("token");

      console.log("Token:", token);

      const response = await fetch(
        `http://${localhostURL}:3001/me/accounts/transactions/deposit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            transactionType,
            depositAmount: transactionAmount,
            token: token,
          }),
        }
      );

      console.log("response in deposit:", response);
      const data = await response.json();

      if (response.ok) {
        console.log("Response Data handleTransaction:", data);
        setBalance(data.amount);
        localStorage.setItem("balance", data.amount);
        setAmount("");
        alert(`Transaction successful`);
      } else {
        console.log("response not ok");
        throw new Error("Failed to make transaction");
      }
      // fetchAccount(token);
    } catch (error) {
      console.error("Error during transaction:", error);
      alert("An error occured while making a transaction: " + error);
    }
  };

  const handleWithdrawTransaction = async (transactionType) => {
    const transactionAmount = parseFloat(amount);

    if (isNaN(transactionAmount) || transactionAmount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    try {
      console.log("start");

      const token = localStorage.getItem("token");

      console.log("Token:", token);

      const response = await fetch(
        `http://${localhostURL}:3001/me/accounts/transactions/withdraw`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            transactionType,
            withdrawAmount: transactionAmount,
            token: token,
          }),
        }
      );

      console.log("response in withdraw:", response);

      if (!response.ok) {
        console.log("response not ok");

        throw new Error("Failed to make transaction");
      }

      const data = await response.json();
      console.log("Response Data handleTransaction:", data);

      setBalance(data.amount);
      localStorage.setItem("balance", data.amount);
      setAmount("");
      alert(`Transaction successful`);
      // fetchAccount(token);
    } catch (error) {
      console.error("Error during transaction:", error);
      alert("An error occured while making a transaction");
    }
  };

  const handleDeposit = () => {
    handleDepositTransaction("deposit");
  };

  const handleWithdraw = () => {
    handleWithdrawTransaction("withdraw");
  };

  const focusLoginForm = () => {
    if (loginFormRef.current) {
      loginFormRef.current.focus();
    }
  };

  if (loggedIn) {
    return (
      <div>
        <Header loggedIn={loggedIn} handleLogout={handleLogout} />
        <div className="min-h-screen bg-base-100 flex items-center flex-col gap-2">
          <h1 className="text-2xl pt-4">Welcome, {username}!</h1>

          <div className="border w-[600px] flex justify-center flex-col items-center h-[300px] p-6 rounded-xl shadow-lg">
            <h2 className="text-xl mb-4">Your account balance is:</h2>
            <p className="text-3xl font-bold text-green-600">{balance} kr</p>
          </div>

          <div className="border w-[600px] flex flex-col items-center gap-4 p-6 rounded-xl shadow-lg mt-6">
            <h2 className="text-lg font-semibold">Make a Transaction</h2>

            <label className="flex flex-col gap-2 w-full">
              <span className="text-sm">
                Enter amount to withdraw or deposit:
              </span>
              <input
                placeholder="Amount in kr"
                type="number"
                className="p-2 border rounded-lg w-full"
                value={amount}
                min="0"
                onChange={(e) => {
                  setAmount(e.target.value);
                }}
              />
            </label>

            <div className="flex gap-4">
              <button
                className={`border p-2 rounded-lg bg-green-400 `}
                onClick={handleDeposit}>
                Deposit
              </button>
              <button
                className={`border p-2 rounded-lg bg-red-400`}
                onClick={handleWithdraw}>
                Withdraw
              </button>
            </div>
          </div>

          <button className="border p-2 rounded-lg" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header
        loggedIn={loggedIn}
        handleLogout={handleLogout}
        focusLoginForm={focusLoginForm}
      />

      <div className="flex flex-col justify-center items-center mt-10">
        <div className="text-2xl mb-4">
          <h1>Welcome to VeloBank!</h1>
        </div>
        <div className="flex gap-8 border p-10 rounded-xl">
          {/* Create Account */}

          <div className="flex flex-col gap-2">
            <h2 className="text-xl">Create Account</h2>
            <label className="border p-2 rounded-xl flex items-center gap-2">
              <input
                type="text"
                fill="currentColor"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </label>
            <label className="border p-2 rounded-xl  flex items-center gap-2">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <div className="flex flex-col">
              <button
                className="border p-2 rounded-lg"
                onClick={handleCreateAccount}>
                Create Account
              </button>
            </div>
          </div>

          {/* Log in */}

          <div className="flex flex-col gap-2">
            <h2 className="text-xl">Log in</h2>
            <label className="border p-2 rounded-xl flex items-center gap-2">
              <input
                type="text"
                fill="currentColor"
                placeholder="Username"
                value={accountDetails.createdUsername}
                onChange={(e) =>
                  setAccountDetails({
                    ...accountDetails,
                    createdUsername: e.target.value,
                  })
                }
                ref={loginFormRef}
              />
            </label>
            <label className="border p-2 rounded-xl  flex items-center gap-2">
              <input
                type="password"
                className="text-base-content"
                placeholder="Password"
                value={accountDetails.createdPassword}
                onChange={(e) =>
                  setAccountDetails({
                    ...accountDetails,
                    createdPassword: e.target.value,
                  })
                }
              />
            </label>
            <div className="flex flex-col gap-2">
              <button
                type="submit"
                className="border p-2 rounded-lg"
                onClick={handleLogin}
                ref={loginButtonRef}>
                Log in
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
