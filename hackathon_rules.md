# Arkiv Web3 Database Builders Challenge — Official Rules & Terms

---

## 1. Overview

The Arkiv Web3 Database Builders Challenge ("Challenge") is organized by Golem Factory GmbH, doing business as "Arkiv Network" ("Organizer"), in collaboration with Ethereum Argentina ("Community Partner"). By submitting an entry, participants agree to these rules in full.

---

## 2. Eligibility

- Open to individuals and teams worldwide
- Participants must be 18 years or older at time of submission
- No purchase necessary to enter
- Employees of Arkiv/Golem Network and their immediate family members are not eligible
- Members of the Ethereum Argentina organizing team may participate but are not eligible for prizes (to avoid conflict of interest)
- One submission per individual or team. Multiple submissions will result in only the last submission being evaluated
- Teams have a size limit of 5, but only **one prize is awarded per winning team** (see Section 5)

---

## 3. Challenge Period

- **Submissions open:** February 23, 2026
- **Challenge kickstart:** February 23, 2026
- **Submissions close:** March 6, 2026 at 23:59 UTC
- **Judging period:** March 9–10, 2026
- **Winners announced:** March 10-11, 2026

Late submissions will not be accepted. The timestamp of the submission form entry is the official record. The Organizer reserves the right to adjust these dates; any changes will be communicated via Discord and official channels.

---

## 4. Submission Requirements

All submissions must be made via the [official submission form](https://forms.arkiv.network/web3-db-challenge). This is the only valid method of submission.

All submissions must include:

| Requirement | Details |
|-------------|---------|
| **GitHub repository** | Public repo with open source license (MIT, Apache 2.0, or equivalent) |
| **Working demo** | Deployed and accessible via URL, connected to Arkiv testnet |
| **README** | Setup instructions, tech stack used, team members, and a brief description of your approach |
| **Submission form** | Completed official submission form with repo link, demo link, team info, and wallet address |

### What counts as a valid submission

- Must fall within one of the three approved verticals: **Job Board**, **Event Platform**, or **Knowledge Base**
- Must use Arkiv as the primary data layer
- Must be original work created during the Challenge period
- Pre-existing code (libraries, frameworks, boilerplate) is allowed, but the Arkiv integration and core application logic must be new
- Use of AI coding assistants (Copilot, Claude, etc.) is allowed and encouraged — we care about the result, not how you got there

### What will disqualify a submission

- Plagiarized or copied code from another participant
- Submissions that don't use Arkiv as the data layer
- Submissions outside the three approved verticals
- Malicious code, backdoors, or security vulnerabilities introduced intentionally
- Submissions that don't include a working demo
- Submissions after the deadline

---

## 5. Prizes

| Place | Prize |
|-------|-------|
| 1st place | $2,500 USD (paid in USDC) |
| 2nd place | $2,500 USD (paid in USDC) |

**Total prize pool: $5,000 USD.**

### Prize conditions

- **Currency:** Stipend disbursed in USDC to the EVM wallet address provided by the winner.
- **The stipend is paid in lieu of self-organized travel and event admission.** Winners are responsible for arranging their own flights, accommodation, and EthCC tickets. The $2,500 is intended to cover these costs at the winner's discretion.
- **One prize per team.** If a winning team has multiple members, the team receives one stipend ($2,500). How the team splits the stipend is their responsibility.
- **KYC is required to claim the prize, not to enter.** All team members must complete KYC individually before funds are disbursed. The prize is sent to a single wallet address confirmed by all team members during the KYC process. See Section 7.
- **Prize is non-transferable** except as described in the runner-up policy (Section 6).
- **Tax obligations** are the winner's sole responsibility. The Organizer does not provide tax advice and will not withhold taxes.

---

## 6. Runner-Up Policy

If a winner cannot or does not claim their prize within **3 calendar days** of the winner announcement:

1. The Organizer will notify the winner and request confirmation
2. If no response or the winner declines, the Organizer may transfer the prize to the next highest-ranked submission
3. The runner-up then has 3 calendar days to complete KYC and claim the prize
4. This process may repeat at the Organizer's discretion

Reasons a winner may not claim include (but are not limited to): inability to complete KYC or failure to respond within the claim window.

If a winner claims the stipend but cannot attend EthCC, they keep the stipend.

---

## 7. KYC & Prize Disbursement

### Who must complete KYC

**All team members** of a winning team must complete KYC individually. This is required before any funds are disbursed.

### Required documents

Each team member must provide:

1. **Government-issued ID** — Passport (preferred): a clear photo or scan of the identification page. National ID: both sides. The document must include your printed signature (most passports have one on the photo page).
2. **Signed declaration form** — We'll provide a PDF form. Print it, **sign it by hand with a pen**, then scan or photograph it. We do not accept digital, typed, or pasted signatures.
3. **Selfie with ID** — A photo of yourself holding your ID next to your face. Both your face and the ID must be clearly readable.

The declaration form will be available as a downloadable PDF linked from these rules and the submission form.

### Process

1. **Winner notified** via email and Telegram (provided in submission form)
2. **Demo video** — winner records a 2-3 minute demo (English or Spanish) and submits the link
3. **KYC submission** — all team members submit the three documents listed above within **3 calendar days** of notification
4. **Wallet confirmation** — all team members indicate the same EVM wallet address in their KYC form, confirming their consent to receive the prize at that address
5. **Verification** — the Organizer verifies documents (~2 business days). If documents are incomplete or incorrect, one correction round is allowed (2 additional days)
6. **Disbursement** — $2,500 USDC sent to the confirmed wallet address on Ethereum mainnet

### KYC data handling

- KYC documents are forwarded to the Organizer's compliance office for processing
- Government IDs and signed forms are retained per the Organizer's compliance requirements
- KYC data will not be shared with third parties except as required by law

---

## 8. Judging

### Panel

- Marcos — Arkiv, Product
- Seweryn — Arkiv, Platform
- Veronica — Builder, 1st Prize Winner - Arkiv Track @ Sub0 Hackathon 2025 BA

Ethereum Argentina is the Community Partner and does not participate in judging to maintain impartiality.

### Evaluation Criteria

| Criteria | Weight | What we're looking for |
|----------|--------|----------------------|
| **Arkiv integration depth** | 40% | How meaningfully does the project use Arkiv's entity system? Proper schemas, queryable attributes, wallet ownership, TTL, entity relationships — not just a key-value wrapper. |
| **Functionality** | 30% | Does it work? Can a user complete the core flows for your vertical? Is it reliable? |
| **Design & UX** | 20% | Is it usable? Does it feel like a product someone would actually use? Does it abstract away blockchain complexity? |
| **Code quality & docs** | 10% | Clean code, good README, setup instructions, reasonable architecture |

All verticals are scored on the same rubric. See the [Builder's Guide](docs/builders-guide.md) for detailed examples of shallow vs. deep Arkiv integration.

### Process

1. All valid submissions are reviewed by the full judging panel
2. Each judge scores independently on all 4 criteria
3. Scores are averaged across judges
4. Final ranking is determined by weighted average score
5. In case of a tie, the panel discusses and reaches consensus
6. Judges' decisions are final and not subject to appeal

---

## 9. Intellectual Property

- **Participants retain full ownership** of their submissions
- By entering, participants grant the Organizer a **non-exclusive, royalty-free, worldwide license** to:
  - Showcase the submission in marketing materials, presentations, and documentation
  - Reference the submission as an example of Arkiv usage
  - Fork the repository for educational or reference purposes
- This license does not transfer ownership. Participants can do whatever they want with their own code.
- All submissions must be published under an **open source license** (MIT, Apache 2.0, or equivalent)

---

## 10. Code of Conduct

Participants agree to:

- Treat other participants, organizers, and community members with respect
- Not engage in harassment, discrimination, or hostile behavior in any Challenge-related channel
- Not attempt to sabotage, interfere with, or copy other participants' submissions
- Not submit content that is illegal, harmful, or violates third-party rights
- Report any concerns to the Organizer via Discord or email

Violations may result in disqualification at the Organizer's sole discretion.

---

## 11. Liability & Disclaimers

- The Organizer is not responsible for technical failures, network issues, or Arkiv testnet downtime that may affect participants' ability to build or submit
- The Organizer is not responsible for travel arrangements, visa applications, accommodation, or any costs beyond the stated prizes
- The Organizer reserves the right to modify these rules, extend deadlines, or cancel the Challenge if circumstances require it. Participants will be notified of any changes via Discord and the official announcement channels.
- In the event of cancellation, no prizes will be awarded unless submissions have already been received and judged
- The Organizer's total liability is limited to the stated prize amounts

---

## 12. Privacy

- Personal information collected through the submission form is used solely for Challenge administration
- Email addresses may be used to communicate about the Challenge (winner notification, updates)
- Participants will not be added to marketing mailing lists without explicit consent
- KYC data is handled as described in Section 7

---

## 13. Governing Law

These rules are governed by the laws of Switzerland. Any disputes will be resolved through good-faith negotiation between the parties.

---

## 14. Contact

Questions about these rules: join our [Discord](https://discord.gg/arkiv) and ask in [**#builders-challenge**](https://discord.com/channels/1422146278883852412/1473629252183392266), or email marcos.miranda@golem.network

---

*By submitting an entry, you confirm that you have read, understood, and agree to these Official Rules & Terms.*