# Arkiv Web3 Database Builders Challenge — FAQ

---

### General

**What is the Arkiv Web3 Database Builders Challenge?**
An invitation to build a web3-native application using Arkiv as the data layer. Pick one of three verticals — Job Board, Event Platform, or Knowledge Base. Two winning teams get $2,500 USD each (paid in USDC) to cover travel and EthCC admission.

**Who can participate?**
Anyone 18+, anywhere in the world. Solo or team. You don't need to be part of Ethereum Argentina.

**Do I need to know Arkiv beforehand?**
No. We provide an SDK, starter kit, and documentation on day 1. The Discord support channel is there for questions throughout the build window.

**Where are the rules hosted?**
In this repo — see [RULES.md](RULES.md). They're also pinned in the [**#builders-challenge**](https://discord.com/channels/1422146278883852412/1473629252183392266) channel on our [Discord](https://discord.gg/arkiv).

**Can I use AI tools (Copilot, Claude, ChatGPT)?**
Yes. We care about the result, not how you got there.

**Can I use pre-existing code, libraries, or boilerplate?**
Yes for libraries, frameworks, and boilerplate. The Arkiv integration and core application logic must be original work created during the challenge period.

---

### Verticals

**What are the three verticals?**

| Vertical | What you build | You're replacing |
|----------|---------------|-----------------|
| **Job Board** | Job platform where postings and profiles are owned by users | LinkedIn, Indeed |
| **Event Platform** | Luma-style tool where events and RSVPs live on-chain | Luma, Eventbrite |
| **Knowledge Base** | Documentation platform where docs belong to you, not the host | GitBook, Notion |

**Do I have to pick one of the three?**
Yes. Your submission must fall into one of the three verticals. This keeps submissions comparable for judging.

**Is one vertical easier or harder than the others?**
No. They're designed to be roughly equal in complexity. Each has a reference data model and minimum requirements in the [Builder's Guide](docs/builders-guide.md). Pick whichever excites you.

**Does my vertical affect my score?**
No. All verticals are scored on the same rubric. A great Event Platform scores the same as a great Job Board.

**Can I combine verticals?**
We'd rather you go deep on one than shallow on two. Pick one and make it excellent. But if you build something that naturally spans two verticals, that's fine — just be clear which vertical you're submitting under.

**Can multiple teams pick the same vertical?**
Yes. There's no cap per vertical. If 8 teams all build a Job Board, that's fine — they're evaluated against each other and against submissions from other verticals.

---

### Teams & Submissions

**Can I participate as a team?**
Yes. The team size limit is 5 members. But there's only one prize per winning team — $2,500 USDC. How you split the stipend is up to you.

**If my team wins, how is the prize distributed?**
All team members must complete KYC, and the $2,500 is sent to one wallet. See [Rules Section 7](RULES.md#7-kyc--prize-disbursement) for details.

**Can I submit more than one project?**
No. One submission per individual or team. If you submit multiple times, only the last submission counts.

**Can I update my submission after submitting?**
Yes. The form allows edits until the deadline. After the deadline, submissions are final.

**What's required in my submission?**
Your chosen vertical, public GitHub repo, working demo URL, README with setup instructions, and the completed [submission form](https://forms.arkiv.network/web3-db-challenge). Full details in [RULES.md](RULES.md).

---

### Building

**Where do I find the requirements for my vertical?**
The [Builder's Guide](docs/builders-guide.md) has minimum requirements, reference data models, and nice-to-haves for each vertical.

**Can I use any tech stack?**
Yes. Arkiv is the data layer — pick whatever you want for the frontend, styling, wallet connection, and hosting.

**Do I need a smart contract?**
Not required. It's a nice-to-have. You can build a fully functional submission using only the Arkiv SDK.

**What chain does this run on?**
Arkiv testnet. Faucet, RPC endpoints, and everything you need to get started are in the [Developer Portal](https://arkiv.network/dev).

**Where do I get help if I'm stuck?**
The [#builders-challenge](https://discord.com/channels/1422146278883852412/1473629252183392266) channel on our [Discord](https://discord.gg/arkiv). The Arkiv team is there daily during the build window.

---

### Prizes & Travel

**What exactly do I win?**
1st and 2nd place each receive: **$2,500 USD paid in USDC** — a stipend to cover self-organized travel and EthCC[9] in Cannes admission (March 30 – April 2, 2026). You arrange your own visa (if needed), flights, ticket, and accommodation.

**Do I need to record a demo video?**
Yes — a demo video is recommended but you can also submit slides. This gives Arkiv content to share and gives your project visibility.

**Can both winners be from the same vertical?**
Yes. We pick the two best submissions regardless of vertical.

**How is the stipend paid?**
In USDC, sent to the EVM wallet address you provide.

**Does the $2,500 cover all travel costs?**
It's designed to cover flights and an EthCC ticket, with room to spare. Buenos Aires → Cannes round trips are running ~$1.2M–$2M ARS. Accommodation, meals, and other expenses are on you. How you spend it is up to you.

**What if I win but can't travel to Cannes?**
You keep the stipend.

**What if I win but can't complete KYC?**
The prize may transfer to the next-ranked submission. You have 3 days to complete KYC after being notified.

**Do I need to do KYC to enter?**
No. KYC is only required to claim a prize. Enter freely, worry about KYC only if you win.

**What KYC do I need?**
All team members must complete KYC individually. You'll need: a government-issued ID, a signed declaration form (we provide the PDF — print it and sign by hand), and a selfie with your ID. Full details in [Rules Section 7](RULES.md#7-kyc--prize-disbursement).

---

### Judging

**How are submissions scored?**
Four criteria with published weights — same rubric for all verticals:

| Criteria | Weight |
|----------|--------|
| Arkiv integration depth | 40% |
| Functionality | 30% |
| Design & UX | 20% |
| Code quality & docs | 10% |

See the [Scoring Rubric](docs/scoring-rubric.md) for the detailed breakdown of what each score means.

**How do you compare submissions across different verticals?**
The rubric is designed to be vertical-agnostic. "Arkiv integration depth" means the same thing whether you built a Job Board or a Knowledge Base — proper entity schemas, queryable attributes, wallet ownership, entity relationships. A great Event Platform and a great Job Board score the same.

**Who are the judges?**
Marcos Miranda (Product, Arkiv), Seweryn (Platform, Arkiv), and Veronica (Builder, 1st Prize Winner — Arkiv Track @ Sub0 Hackathon 2025 BA). Ethereum Argentina does not participate in judging.

**Can I get feedback on my submission?**
Winners get feedback through the announcement. Individual feedback for non-winners may happen post-challenge but isn't guaranteed.

---

### Rules

**Where are the full rules?**
[Official Rules & Terms](RULES.md)

**Who owns the code I write?**
You do. By entering, you grant Arkiv a non-exclusive license to showcase your project (marketing, docs, presentations). You can do whatever you want with your own code.

**What license do I need?**
Open source — MIT, Apache 2.0, or equivalent.

**What gets me disqualified?**
Plagiarism, not using Arkiv as the data layer, malicious code, no working demo, submitting outside the three verticals, or submitting after the deadline.

---

*Don't see your question? Join our [Discord](https://discord.gg/arkiv) and ask in [#builders-challenge](https://discord.com/channels/1422146278883852412/1473629252183392266).*