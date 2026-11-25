# Shaadi OS: business plan (indie hacker edition)

> *"Fufa ki narazgi se accha, to Shaadi OS ko paisa dena hai."*

**One line:** a WhatsApp-native command center for Indian weddings. Families post kaam in the group ("Bua ji ko Charbagh se laana hai, 3 baje"), by text or voice note, in any Indian language. The bot turns it into a task, a cousin claims it, and everyone is on the live map. The invite website, RSVPs and Uber/Rapido backup come in the same product.

**The indie constraint:** one founder, no funding, no sales team. Every choice below optimises for **low fixed cost, built-in virality and pricing per wedding**, so the business is profitable from the first paying weddings, not after scale.

> Numbers marked *(assumption)* are planning estimates. Check them against current vendor pricing before relying on them.

---

## 1. Who pays, and why

| | |
|---|---|
| **Buyer** | The wedding family. In practice, the person in charge of logistics: the bride's or groom's sibling, or the "responsible cousin", aged 24–35, who already manages a chaotic WhatsApp group. |
| **Payer** | Usually a parent. The cousin is the champion; the parent approves ₹4,999 without blinking on a wedding that costs lakhs. |
| **Pain** | A guest left waiting at the station, five people asking "kaun jaa raha hai?", a missed pickup that turns into a family drama (*fufa ki narazgi*). |
| **Why now** | Everyone is already on WhatsApp. Sarvam makes Hindi and regional voice notes usable, and elders send voice notes, not forms. |

**Not the first customer:** big-budget weddings with a full planner (later, through a partner channel), and NRI destination weddings (later, the "Big fat wedding" tier).

---

## 2. Pricing

### The principle: price per wedding, not per month
A wedding is a **one-time, 3–7 day event**, and families hate subscriptions they forget to cancel. A single price per wedding:
- matches how families think about spending ("one more line in the wedding budget"),
- has no churn to manage (each wedding is a new sale), and
- costs us **nothing after the wedding**, because cost per wedding stops when the wedding ends.

### Tiers (these match the landing page)

| Plan | Price | Who | What's in it | Why it's priced so |
|---|---|---|---|---|
| **Home wedding** | **₹0** | Small functions, up to 50 guests | Control room, live map, WhatsApp group with *rule-based* parsing, 1 invite template, Hindi + English | The free plan is a **marketing channel, not charity**. Every invite carries "Made with ❤️ on Shaadi OS". It uses no Sarvam AI, so it costs us almost nothing. |
| **Grand wedding** | **₹4,999 / wedding** | The main product: 3 days, 5 functions, 100–500 guests | Unlimited guests, **Sarvam AI** (voice notes, any place, replies in the sender's language), invite in 22 languages, all templates, Uber/Rapido backup, catering export | About 0.1% of a ₹5–20 lakh wedding. Cheaper than **one** wrong cab ride or one upset relative. |
| **Big fat wedding** | **from ₹24,999** | 1,000+ guests, multi-city, destination | Multi-city fleet, a dedicated WhatsApp number, priority support for the wedding week, custom integrations | High-touch work is only sold at a price that pays for founder time. |
| **Planner plan** *(new)* | **₹1,999 / month**, up to 4 weddings at once | Wedding planners, tent houses, caterers | Everything in Grand, a multi-wedding dashboard, white-label invite footer | Turns a channel partner into a paying customer (see GTM). |

### Add-ons (high margin, optional)
- **Rides convenience fee:** ₹19 per real Uber/Rapido booked through the app. It only applies when `real_rides` is on.
- **Extra wedding days or functions** beyond 7 days: ₹999.
- **Printed QR standee** for the venue (join the group, see the invite): ₹499. Printed on demand, so there's no inventory.

### How the price is enforced (we already have the pieces)
- **Flagsmith** gates features by plan: `ai_understanding`, `whatsapp_voice_notes`, `whatsapp_native_replies` and `invite_translation` are **off on the free plan**. Upgrading flips them with no redeploy.
- **Flagsmith A/B tests** the price itself: show ₹3,999, ₹4,999 or ₹5,999 to new visitors and measure paid conversion. Never guess a price you can test.
- **Payment:** Razorpay or UPI one-time payment links, collected **before the first function** (haldi or mehendi), with a full refund up to 48 hours before it. That removes the "will it work at my wedding?" fear.

---

## 3. Unit economics: why every Grand wedding is profitable

Costs per **Grand wedding** (about 300 guests, a 5-day window) *(assumptions)*:

| Cost item | Rough usage | Est. cost |
|---|---|---|
| Sarvam speech-to-text | ~150 voice notes × ~15 s ≈ 40 min | ₹25–50 |
| Sarvam chat (understanding) | ~1,500 requests, short prompts | ₹50–150 |
| Sarvam translate + TTS | Replies in the sender's language + invite in a few languages (cached) | ₹50–150 |
| WhatsApp | Today: our bridge (₹0 per message). Later: official Business API, per-conversation fees | ₹0 → ₹150–300 |
| Hosting share | Vercel + one small always-on box for bridges, split across live weddings | ₹50–100 |
| Payment gateway | ~2% + GST on ₹4,999 | ~₹120 |
| Support time | Mostly self-serve; ~20 min of founder WhatsApp support | (founder time) |
| **Total variable cost** | | **≈ ₹300–850** |

**Gross margin per Grand wedding: about 83–94%** (₹4,150–4,700 kept from ₹4,999).

**Cost controls already built into the product:**
- Short messages ("ok", "👍", chit-chat) **never** reach the AI.
- Invite translations are **cached**, so each language of a page costs credits once.
- Voice notes are limited to the 30-second sync API, with no batch processing.
- If Sarvam is down or over budget, the bot falls back to the free rule parser instead of failing.
- A Flagsmith switch can turn off any costly feature across the whole product at once.

### Fixed costs (monthly) *(assumptions)*

| Item | ₹ / month |
|---|---|
| Hosting (Vercel Pro + 1 small VPS for bridges) | ~3,500 |
| Domain, email, monitoring (free tiers first) | ~500 |
| Paid ads | **0** at launch (see GTM) |
| **Total fixed** | **~₹4,000** |

### Break-even and the "ramen profitable" line
- **Break-even:** **1 Grand wedding a month** covers fixed costs.
- **Ramen profitable** (₹1 lakh a month take-home): about **25 Grand weddings a month**, or 15 Grand plus 10 planners.
- **Good indie business** (₹5 lakh a month): about 100 Grand-wedding equivalents a month. India has roughly a crore weddings a year (commonly cited estimate), so that is a tiny fraction of the market.

### The seasonality trap, and how we handle it
Indian weddings bunch up around muhurat dates (roughly Nov–Feb and Apr–Jun), and some months are almost empty. Indie rules:
1. **Fixed costs stay tiny** (₹4k a month), so a dead month costs almost nothing.
2. **Bank the peak:** keep 6 months of fixed costs (~₹25k) as a buffer, built from the first season.
3. **Off-season revenue:** the planner plan (planners plan in the off-season), plus off-season events using the same product: engagements, griha pravesh, big birthdays and family reunions.

---

## 4. Go-to-market

### Positioning
- **Category:** "the wedding WhatsApp group, but it actually gets things done". Not "wedding planning software"; families don't buy software.
- **Hook:** the fufa joke. Emotional and funny, built for Instagram, and it names the real pain: family drama from a logistics miss.

### Beachhead: Lucknow first, then the Hindi belt
The product already knows Lucknow (Charbagh, Amausi airport, Aminabad, Gomti Nagar). **One city first:**
- word of mouth stays dense (the same relatives attend each other's weddings),
- vendor partnerships are local and can be built in person, and
- the demo looks real because the places are real.

Then expand to **Kanpur, Varanasi, Prayagraj, Patna and Jaipur**. These cities have similar culture, Hindi voice notes, and big families travelling by train, which is exactly where pickups go wrong.

### Channels, ranked by cost

**1. Built-in virality (₹0, the main engine)**
Every wedding exposes 100–500 people to the product in a good moment:
- the invite website footer: "Made with ❤️ on Shaadi OS" → landing page,
- the WhatsApp group bot: 50+ relatives watch `take 7` → "🙌 Pinku took it" work live,
- the venue QR standee to join the group.

Goal: **every wedding brings in one more wedding** (a viral coefficient of about 1, *assumption*). Track it with "how did you hear about us?" at signup plus `?ref=` on invite links.

**2. Founder-led content (₹0)**
- Instagram reels and YouTube Shorts of wedding-logistics chaos ("Bua ji station pe 2 ghante" → the bot fixing it), Hinglish, meme-first.
- Live-build in public on X and LinkedIn (indie hacker audience; also brings early adopters and press).
- A post-wedding "logistics report" image for the family to share ("47 pickups, 0 missed, avg wait 6 min").

**3. Vendor partners (B2B2C, revenue share)**
Wedding planners, tent houses, caterers and banquet halls already talk to every family:
- they get **20% revenue share** on Grand weddings they refer, or the **planner plan** if they run many weddings,
- they gain a premium differentiator ("we come with live guest logistics"),
- a white-label footer is available on the planner plan.

Target: **10 Lucknow vendors** in season one, signed in person.

**4. Community seeding (₹0)**
- RWA and society WhatsApp groups, local Facebook groups, college alumni groups (the "responsible cousin" age group).
- The free Home wedding plan for small functions (engagements, roka) gets families in early, and they upgrade for the main wedding.

**5. Paid ads: only after the funnel converts**
Turned on only when `free → Grand` conversion and repeat-referral rates are known. Instagram ads targeting people engaged in the last 6 months, in the beachhead city. Capped so that customer acquisition cost stays **below ₹1,000** (under 20% of a ₹4,999 sale).

### Launch plan

| When | What | Goal |
|---|---|---|
| **Now** (hackathon) | Working demo: WhatsApp group bot, Sarvam voice notes, live map, Flagsmith | Credibility, first sign-ups for `/early-access` |
| **Weeks 1–4** | 5 **free design-partner weddings** in Lucknow (friends and family), with the founder on call | Testimonials, reels footage, fixing real-world bugs |
| **Weeks 5–12** (peak season) | Paid Grand plan live, 10 vendor partners, weekly reels | **25 paid weddings**, which is ramen profitable |
| **Next season** | 2–3 more Hindi-belt cities; planner plan; official WhatsApp Business API | 100 Grand-wedding equivalents a month |

---

## 5. Metrics we watch (one dashboard, weekly)

| Metric | Target |
|---|---|
| Free → Grand conversion | ≥ 10% |
| Weddings from referral or invite footer | ≥ 50% of new weddings |
| Gross margin per Grand wedding | ≥ 80% |
| Missed or late pickups per wedding | ≈ 0, which is the product promise |
| Customer acquisition cost (when ads are on) | < ₹1,000 |
| Refunds | < 5% |
| Months of runway on fixed costs | ≥ 6 |

---

## 6. Risks and how we stay alive

| Risk | Mitigation |
|---|---|
| **WhatsApp bans the bridge number.** Baileys is unofficial. | Use one dedicated number per wedding, not personal numbers. Move paid tiers to the **official WhatsApp Business API** once revenue covers per-conversation fees (priced into the Grand plan). Flagsmith can switch to dashboard-only mode in seconds. |
| **AI costs spike** (abuse, a chatty group). | Cap AI calls per wedding, cache, keep the rule-parser fallback, and use Flagsmith to turn features off. |
| **Seasonality.** | Tiny fixed costs, a runway buffer, the planner plan and off-season family events. |
| **A big player copies us.** | Speed and focus. We own "WhatsApp-native for the family", while big players build planner-first SaaS. Data on which pickups go wrong where, by city, makes the product better each season. |
| **Founder burnout during peak.** | Self-serve onboarding, the bot handles routine questions, and a hard cap on concurrent Big-fat weddings. |

---

## 7. Why this works as an indie business
1. **Price per wedding**, so there's no churn, cash comes upfront, and costs stop when the wedding ends.
2. **83–94% gross margin**, because AI is used only where it adds value and everything else is cached or rule-based.
3. **Break-even at one wedding a month**, with ₹4k a month in fixed costs.
4. **Distribution is built into the product:** every wedding shows it to hundreds of future customers.
5. **Feature flags as a business lever:** the same Flagsmith switches that protect the demo also gate plans, test prices and cut costs instantly.
