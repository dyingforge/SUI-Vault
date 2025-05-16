# SUI-Vault
🔐 Sui On-Chain Vault
Sui Vault is an on-chain secure asset management smart contract that allows a user (the owner) to deposit funds and only withdraw them after approval by a predefined verifier. It ensures collaborative and verifiable control over sensitive asset movements.

🧩 Features
✅ Vault Creation: Users can create a vault by specifying a verifier address.

💰 Deposit Funds: Anyone can deposit SUI or supported tokens into the vault.

🔓 Withdraw Request: Only the vault owner can initiate a withdrawal request.

🛡 Verifier Approval: Withdrawals are executed only after explicit approval from the assigned verifier.

🔒 Trust-Minimized: Funds are locked until the request flow is completed.

⚙️ Workflow
Owner creates vault and assigns a verifier.

Funds are deposited into the vault.

Owner initiates a withdrawal request.

Verifier approves the request.

Funds are released to the owner.

🚀 Live Demo
Try it out now: https://your-project-site.vercel.app
(Replace with your actual deployment link)

🛠 Tech Stack
Sui Move – Smart contract logic

TypeScript + Next.js – Frontend

Sui Wallet – User authentication and signing

Vercel – Deployment

