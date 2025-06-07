import React, { useState } from "react";
// PUBLIC_INTERFACE
// All main SplitEase component code in one file for clarity and ease of review/extension.
// In real project, consider splitting by page/component.
// TailwindCSS must be installed & imported in index.js or index.css.

const COLORS = {
  primary: "#2563eb",
  secondary: "#f1f5f9",
  accent: "#f59e42",
};

// Util: fake OCR extraction for demo/stub
function mockExtractItems(file) {
  // Simulate async OCR
  return new Promise((resolve) =>
    setTimeout(() => {
      resolve([
        { id: 1, name: "Pad Thai", price: 14.0 },
        { id: 2, name: "Spring Rolls", price: 7.0 },
        { id: 3, name: "Drinks", price: 9.0 },
        { id: 4, name: "Tax", price: 2.44, type: "tax" },
        { id: 5, name: "Tip", price: 3.00, type: "tip" },
        { id: 6, name: "Total", price: 35.44, type: "total" },
      ]);
    }, 1500)
  );
}

// PUBLIC_INTERFACE
function App() {
  // App state: auth, nav, files, ocr, assignment, etc.
  const [user, setUser] = useState(null); // null = not logged in
  const [nav, setNav] = useState("dashboard"); // dashboard | history | settle
  const [authError, setAuthError] = useState("");
  const [receiptUpload, setReceiptUpload] = useState(null); // File
  const [ocrItems, setOcrItems] = useState([]); // [{id, name, price}]
  const [ocrStatus, setOcrStatus] = useState("idle"); // idle|pending|done
  const [friends, setFriends] = useState(["You", "Alex", "Sam", "Morgan"]); // Example friends list
  const [itemAssignments, setItemAssignments] = useState({}); // itemId -> [friend name]
  const [splitSummary, setSplitSummary] = useState({}); // friend -> share
  const [history, setHistory] = useState([]); // Past bills [{id, name, items, date}]
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Auth: Supabase stubs (real: use supabase-js or supabase-ui)
  // PUBLIC_INTERFACE
  function handleLogin(email, password) {
    // TODO: integrate with Supabase Auth API
    // Stub: Any email/pw succeeds
    setUser({ email, name: email.split("@")[0] });
    setAuthError("");
  }
  // PUBLIC_INTERFACE
  function handleSignup(email, password) {
    // Stub: Always succeeds. Real: use Supabase signUp
    setUser({ email, name: email.split("@")[0] });
    setAuthError("");
  }
  // PUBLIC_INTERFACE
  function handleGoogleOAuth() {
    // Stub: "Log in as GoogleUser"
    setUser({ email: "user@gmail.com", name: "GoogleUser" });
  }
  // PUBLIC_INTERFACE
  function handleLogout() {
    setUser(null);
    setNav("dashboard");
  }

  // Receipt upload/parse
  // PUBLIC_INTERFACE
  async function handleReceiptUpload(e) {
    const file = e.target.files[0];
    setReceiptUpload(file);
    setOcrStatus("pending");
    setShowAssignModal(true);
    // In real app: upload file to Supabase Storage, get public URL
    // Then send file or URL to backend that calls Google Cloud Vision OCR
    // Here, we use a stub/mock
    const items = await mockExtractItems(file);
    setOcrStatus("done");
    setOcrItems(items);
    setItemAssignments({});
    // Assign "You" to all by default (for demo)
    let initial = {};
    items.forEach((it) => {
      if (it.type === "tax" || it.type === "tip" || it.type === "total") initial[it.id] = friends.slice(0,1);
      else initial[it.id] = ["You"];
    });
    setItemAssignments(initial);
  }

  // Assignment UI
  // PUBLIC_INTERFACE
  function handleAssignment(itemId, friend) {
    setItemAssignments((cur) => {
      let currentAssignees = cur[itemId] || [];
      if (currentAssignees.includes(friend)) {
        return { ...cur, [itemId]: currentAssignees.filter(f => f !== friend) };
      } else {
        return { ...cur, [itemId]: [...currentAssignees, friend] };
      }
    });
  }

  // Compute split in real-time when assignments/items change
  React.useEffect(() => {
    // Sum all item prices, assign shares (tax/tip split by who has real food)
    let shares = {};
    friends.forEach(f => shares[f] = 0);
    let baseItems = ocrItems.filter(it => !["tax","tip","total"].includes(it.type));
    let baseItemIds = baseItems.map(it => it.id);
    // Distribute main items
    ocrItems.forEach(item => {
      if (!item.price || item.type === "total") return;
      let assignees = itemAssignments[item.id] || [];
      if (assignees.length === 0) return;
      // Tax/tip will be even-split among everyone who ate
      if (item.type === "tax" || item.type === "tip") {
        // Only those who have any item assigned
        let splitAmong = friends.filter(fr =>
          baseItemIds.some(id => (itemAssignments[id] || []).includes(fr))
        );
        splitAmong = splitAmong.length > 0 ? splitAmong : friends;
        let share = item.price / splitAmong.length;
        splitAmong.forEach(f => { shares[f] += share; });
      } else {
        let share = item.price / assignees.length;
        assignees.forEach(f => { shares[f] += share; });
      }
    });
    setSplitSummary(shares);
  }, [ocrItems, itemAssignments, friends]);

  // Save processed bill to history after assignment
  function finalizeReceipt() {
    let date = new Date().toISOString().slice(0,10);
    setHistory([{
      id: Math.random().toString(36).substr(2,9),
      date,
      items: ocrItems,
      assignments: itemAssignments,
      split: splitSummary,
      filename: receiptUpload ? receiptUpload.name : `Receipt ${date}`
    }, ...history]);
    setShowAssignModal(false);
    setOcrItems([]);
    setItemAssignments({});
    setOcrStatus("idle");
    setReceiptUpload(null);
  }

  // Payment integration stubs
  function handleVenmoPayment(friend, amount) {
    // STUB: Launch Venmo API/payment flow.
    alert(`Venmo payment of $${amount.toFixed(2)} to ${friend} (Demo only)`);
  }
  function handlePayPalPayment(friend, amount) {
    // STUB: Launch PayPal API/payment flow.
    alert(`PayPal payment of $${amount.toFixed(2)} to ${friend} (Demo only)`);
  }
  // Export as PDF stub
  function exportReceiptAsPDF(receipt) {
    // STUB: Use html2pdf or browser print to PDF in real solution
    alert(`Exporting "${receipt.filename}" as PDF (Demo stub)`);
  }

  // Auth screens
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100">
        <div className="w-full max-w-md bg-white shadow rounded px-8 py-8 flex flex-col gap-4">
          <div className="text-3xl font-bold text-center text-blue-700 mb-2">SplitEase</div>
          <div className="text-center text-sm mb-2 text-gray-500">Sign in to continue</div>
          <form
            onSubmit={e => {
              e.preventDefault();
              const email = e.target.email.value, pw = e.target.password.value;
              handleLogin(email, pw);
            }}
            className="flex flex-col gap-2"
          >
            <input name="email" type="email" required placeholder="Email" className="border rounded px-3 py-2" />
            <input name="password" type="password" required placeholder="Password" className="border rounded px-3 py-2" />
            <button type="submit" className="btn bg-blue-600 hover:bg-blue-700 text-white py-2 rounded w-full">Login</button>
          </form>
          <button
            className="btn bg-white border border-slate-300 text-black py-2 rounded w-full flex items-center justify-center gap-2"
            onClick={handleGoogleOAuth}
          >
            <span className="text-lg">🔵</span> Login with Google
          </button>
          <div className="text-center text-sm mt-2">
            No account?{" "}
            <button className="text-blue-700 underline" onClick={() => {
              // Show signup modal/logic. For demo, handles inline:
              const email = prompt("Email for signup:");
              const pw = prompt("Password:");
              if (email && pw) handleSignup(email, pw);
            }}>Sign up</button>
          </div>
          {authError && <div className="text-red-500 text-center">{authError}</div>}
        </div>
      </div>
    );
  }

  // App Layout
  return (
    <div className="flex bg-slate-100 min-h-screen relative">
      {/* Sidebar */}
      <nav className="w-60 bg-white border-r border-slate-300 flex flex-col py-8 px-4 gap-6 min-h-screen fixed left-0 top-0 z-20">
        <div className="flex items-center gap-2 text-2xl font-bold text-blue-700 mb-6">
          <span className="rounded bg-blue-600 px-2 py-1 text-white">💸</span> SplitEase
        </div>
        <button
          className={`text-left px-3 py-2 rounded hover:bg-blue-50 font-medium ${nav==="dashboard"?"bg-blue-100 text-blue-700":""}`}
          onClick={() => setNav("dashboard")}
        >🏠 Dashboard</button>
        <button
          className={`text-left px-3 py-2 rounded hover:bg-blue-50 font-medium ${nav==="history"?"bg-blue-100 text-blue-700":""}`}
          onClick={() => setNav("history")}
        >📃 History</button>
        <button
          className={`text-left px-3 py-2 rounded hover:bg-blue-50 font-medium ${nav==="settle"?"bg-blue-100 text-blue-700":""}`}
          onClick={() => setNav("settle")}
        >💳 Settle-up</button>
        <div className="flex-grow"></div>
        <div className="flex flex-col gap-2">
          <div className="text-xs text-slate-400 pl-3">Logged in as</div>
          <div className="text-slate-700 font-semibold px-3">{user?.name}</div>
          <button
            className="text-sm text-left px-3 py-1 mt-1 border border-slate-300 bg-white text-red-500 rounded hover:bg-red-50"
            onClick={handleLogout}
          >Logout</button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 ml-60 p-6 overflow-auto">
        {nav === "dashboard" && (
          <DashboardView
            ocrStatus={ocrStatus}
            handleReceiptUpload={handleReceiptUpload}
            ocrItems={ocrItems}
            receiptUpload={receiptUpload}
            showAssignModal={showAssignModal}
            setShowAssignModal={setShowAssignModal}
            friends={friends}
            itemAssignments={itemAssignments}
            handleAssignment={handleAssignment}
            splitSummary={splitSummary}
            finalizeReceipt={finalizeReceipt}
          />
        )}
        {nav === "history" && (
          <HistoryView
            history={history}
            friends={friends}
            exportReceiptAsPDF={exportReceiptAsPDF}
          />
        )}
        {nav === "settle" && (
          <SettleUpView
            friends={friends}
            splitSummary={splitSummary}
            user={user}
            handleVenmoPayment={handleVenmoPayment}
            handlePayPalPayment={handlePayPalPayment}
          />
        )}
      </main>
      {/* Mobile screen: show nav as top bar */}
      <style>
        {`
        @media (max-width: 800px) {
          nav { position:fixed;width:100vw;height:60px;left:0;top:0;flex-direction:row;align-items:center;gap:8px;padding:0 8px;z-index:30}
          main { margin-left:0;padding-top:70px; }
          .ml-60 { margin-left:0!important;}
        }
        `}
      </style>
    </div>
  );
}

// Dashboard includes: upload, status, active bill assignment+split panel
function DashboardView(props) {
  return (
    <div>
      <div className="text-2xl font-bold mb-4 text-blue-900">Dashboard</div>
      {/* Receipt upload */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <div className="text-blue-700 font-semibold mb-1">Upload a receipt</div>
        <input
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          className="block"
          onChange={props.handleReceiptUpload}
          disabled={props.ocrStatus === "pending"}
        />
        <div className="text-xs text-slate-500 mt-1">
          Accepts: JPG, PNG, PDF. All files processed securely in browser (demo).
        </div>
        {props.ocrStatus === "pending" && (
          <div className="mt-3 flex items-center gap-2 text-blue-600 font-medium">
            <svg className="animate-spin mr-2 h-5 w-5 text-blue-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C6.477 0 2 4.477 2 10h2z"/>
            </svg>
            Processing OCR...
          </div>
        )}
      </div>
      {/* Modal for item assignment */}
      {props.showAssignModal && (
        <AssignItemModal
          ocrItems={props.ocrItems}
          friends={props.friends}
          itemAssignments={props.itemAssignments}
          handleAssignment={props.handleAssignment}
          splitSummary={props.splitSummary}
          onClose={() => props.setShowAssignModal(false)}
          onConfirm={props.finalizeReceipt}
        />
      )}
      {/* Active Split */}
      <div className="bg-white p-4 rounded shadow mt-6">
        <div className="font-semibold text-blue-700 mb-2">Current Split</div>
        <SplitSummary summary={props.splitSummary} friends={props.friends} />
      </div>
    </div>
  );
}

// Assign items to friends modal/page
function AssignItemModal({
  ocrItems, friends, itemAssignments, handleAssignment, splitSummary, onClose, onConfirm
}) {
  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black/30 z-40 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow max-w-lg w-full">
        <div className="flex justify-between items-center mb-3">
          <div className="text-xl font-bold text-blue-700">Assign Items</div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-lg">&times;</button>
        </div>
        <div className="max-h-72 overflow-y-auto">
          {ocrItems.map((item) => (
            <div key={item.id} className="flex items-center border-b py-2 last:border-b-0">
              <div className="flex-1 text-slate-800">{item.name}
                <span className="ml-2 text-xs text-slate-400">{item.type === "tax" ? "(tax)" : item.type === "tip" ? "(tip)" : ""}</span>
              </div>
              <div className="w-20 text-right font-semibold text-slate-700">${item.price?.toFixed(2) ?? ""}</div>
              {/* Assignment checkboxes */}
              <div className="ml-2 flex gap-2">
                {friends.map(fr => (
                  <label key={fr} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={(itemAssignments[item.id]||[]).includes(fr)}
                      onChange={() => handleAssignment(item.id, fr)}
                      className="mr-1"
                    />
                    <span className="text-xs">{fr}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t pt-3 mt-3">
          <div className="font-semibold mb-1 text-blue-800">Split Preview:</div>
          <SplitSummary summary={splitSummary} friends={friends} />
        </div>
        <button className="btn bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 mt-3 rounded"
          onClick={onConfirm}
        >Save &amp; Add to History</button>
      </div>
    </div>
  );
}

// Split display component
function SplitSummary({ summary, friends }) {
  return (
    <div className="flex flex-col gap-0.5">
      {friends.map(fr => (
        <div key={fr} className="flex items-center">
          <span className="flex-1">{fr}</span>
          <span className="font-semibold text-blue-700">${(summary[fr]||0).toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}

// History view
function HistoryView({ history, friends, exportReceiptAsPDF }) {
  return (
    <div>
      <div className="text-2xl font-bold mb-4 text-blue-900">History</div>
      {history.length === 0 && (
        <div className="text-slate-500">No receipts in history yet.</div>
      )}
      <div className="space-y-4">
        {history.map(receipt => (
          <div key={receipt.id} className="bg-white rounded shadow p-4 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-blue-800">{receipt.filename}</div>
              <span className="text-slate-500 text-xs">{receipt.date}</span>
            </div>
            <div className="border-b pb-2 mb-2">
              <div className="grid grid-cols-3 gap-1 text-xs text-slate-400">
                <div>Item</div><div>Who</div><div>Price</div>
              </div>
              {receipt.items.map(it => (
                <div className="grid grid-cols-3 gap-1 text-sm" key={it.id}>
                  <div>{it.name}</div>
                  <div className="truncate">{(receipt.assignments[it.id]||[]).join(", ")}</div>
                  <div className="text-right">${it.price?.toFixed(2) ?? ""}</div>
                </div>
              ))}
            </div>
            <div className="mb-2">
              <div className="font-semibold text-blue-700 mb-1">Split</div>
              <SplitSummary summary={receipt.split} friends={friends} />
            </div>
            <div>
              <button
                onClick={() => exportReceiptAsPDF(receipt)}
                className="text-blue-700 underline text-sm"
              >Export as PDF</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Settle-up payments
function SettleUpView({ friends, splitSummary, user, handleVenmoPayment, handlePayPalPayment }) {
  // All-to-all, or only user paying others? Show splits for all but "You"
  // (In a real app we'd compute net balances per person)
  return (
    <div>
      <div className="text-2xl font-bold mb-4 text-blue-900">Settle-up</div>
      <div className="mb-4 text-slate-700">Pay or request via Venmo/PayPal. This is a demonstration; connect real accounts in production.</div>
      <div className="space-y-3">
        {friends.filter(f => f !== "You").map(fr => (
          <div key={fr} className="bg-white p-3 rounded shadow flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="font-semibold">{fr}</div>
              <span className="text-slate-600 text-sm">Owes: <span className="text-blue-700 font-bold">${(splitSummary[fr]||0).toFixed(2)}</span></span>
            </div>
            <div className="flex gap-2">
              <button
                className="btn bg-orange-400 hover:bg-orange-500 text-white px-3 py-1 rounded"
                onClick={() => handleVenmoPayment(fr, splitSummary[fr]||0)}
              >Venmo</button>
              <button
                className="btn bg-blue-700 hover:bg-blue-800 text-white px-3 py-1 rounded"
                onClick={() => handlePayPalPayment(fr, splitSummary[fr]||0)}
              >PayPal</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
