const sessions = new Map();

const DEFAULT_BALANCE = 10000;

function getOrCreate(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      balance: DEFAULT_BALANCE,
      createdAt: new Date(),
      totalBet: 0,
      totalWin: 0,
      spins: 0,
    });
  }
  return sessions.get(sessionId);
}

function debit(sessionId, amount) {
  const session = getOrCreate(sessionId);
  if (session.balance < amount) return false;
  session.balance -= amount;
  session.totalBet += amount;
  session.spins++;
  return true;
}

function credit(sessionId, amount) {
  const session = getOrCreate(sessionId);
  session.balance += amount;
  session.totalWin += amount;
}

function getBalance(sessionId) {
  return getOrCreate(sessionId).balance;
}

function getSessionStats(sessionId) {
  return getOrCreate(sessionId);
}

module.exports = { getOrCreate, debit, credit, getBalance, getSessionStats };