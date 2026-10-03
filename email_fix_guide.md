# How to Fix "Email to Spam" Issues 📧

The problem: You are using the default `noreply@lifeline-108.firebaseapp.com` address. Email providers (Gmail, Outlook) see this as a "Shared" address and often mark it as Spam/Promotions because it lacks **Domain Reputation**.

## The Solution: Use a Custom Domain 🌐
To guarantee emails hit the Inbox, you must verify that you own the domain you are sending from.

### Step 1: Buy a Domain
You need a real domain (e.g., `www.lifeline108.com` or `.in`). You can buy one from GoDaddy, Namecheap, or Google Domains.

### Step 2: Connect to Firebase
1.  Go to **Firebase Console** > **Hosting**.
2.  Click **Add Custom Domain**.
3.  Enter your domain (e.g., `lifeline108.com`).
4.  Firebase will give you **DNS Records** (A records and TXT records).
5.  Go to your Domain Provider (e.g., GoDaddy) and add these records.

### Step 3: Verify Email Sender (CRITICAL) 🛡️
This is the step that fixes the Spam issue.
1.  Go to **Firebase Console** > **Authentication** > **Templates**.
2.  Click the **Pencil Icon** (Edit) next to "Email address verification".
3.  Click **"Customize domain"**.
4.  Enter your new domain (e.g., `lifeline108.com`).
5.  Firebase will verify that you have connected the domain in Hosting.
6.  **SPF/DKIM**: Firebase might ask you to add `v=spf1...` or `DKIM` records to your DNS. **Do this.** It proves to Google/Yahoo that you are the real sender.

## Summary
| Setup | Inbox Probability |
| :--- | :--- |
| Default (`firebaseapp.com`) | Unpredictable (Often Spam) ❌ |
| Custom Domain + Verified DNS | High (Inbox) ✅ |

## Immediate Workaround
Until you buy a domain, encourage users to use **"Sign in with Google"**. It verifies them instantly without sending any email at all!
