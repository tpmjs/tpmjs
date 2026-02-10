# Pricing Page Copy

## Pricing Philosophy

### Why Freemium Works for Developer Tools

Developer tools live or die on adoption. Developers do not buy tools they have not used. The freemium model works because it aligns with how developers evaluate software:

1. **Try before trust.** Developers install, test, and integrate before they consider paying. A free tier removes the only barrier between curiosity and adoption.
2. **Bottom-up purchasing.** Individual developers adopt tools. Teams standardize on them. Companies pay for them. The free tier seeds the first stage.
3. **Network effects.** Every free user who publishes a tool or installs a package increases the registry's value for everyone. Free users are not a cost center -- they are the growth engine.
4. **Switching costs compound.** Once a team builds agents on TPMJS tools, switching means rewriting integrations. The free tier gets tools into codebases. Stickiness does the rest.

### Psychology of Pricing for TPMJS

TPMJS pricing should reflect a core truth: **the registry itself is the product, and its value scales with usage.** Free users populate and validate the registry. Pro users need reliability and scale. Enterprise users need control and compliance.

The pricing should feel inevitable, not extractive. Developers should think: "Of course I need the Pro tier now -- I have 50 tools in production and need guaranteed uptime."

---

## Tier Structure

### Free Tier

#### Name Suggestions
1. **Starter** -- straightforward, no baggage, implies a beginning
2. **Community** -- emphasizes the open-source ethos and registry contribution
3. **Open** -- reinforces the open protocol / open registry positioning

**Recommended: Community** -- it signals that free users are valued participants, not second-class citizens.

#### What Is Included
- Access to the full public tool registry (1M+ packages)
- Install unlimited tools via npm
- Publish unlimited tools to the registry
- MCP protocol support (Claude, GPT, Cursor, Windsurf)
- Quality scores and tool search
- Community support (GitHub Issues, Discord)
- Basic usage analytics (install counts for your published tools)

#### Card Copy

**Community**
$0 / month

Everything you need to build AI agents with production-ready tools.

- Full registry access (1M+ packages)
- Unlimited installs
- Publish your own tools
- MCP protocol support
- Quality scores and search
- Community support

[Get Started -- Free Forever]

#### Why This Tier Exists

**Reciprocity:** Give developers real value for free, and they become advocates. Every free user who publishes a tool or stars a repo is marketing you cannot buy.

**Endowment effect:** Once developers have tools installed and agents running, those tools feel like theirs. The cost of removing them (rewriting integrations) exceeds the cost of upgrading. The free tier creates ownership. Ownership creates upgrade pressure.

---

### Pro Tier

#### Name Suggestions
1. **Pro** -- universally understood, implies professional use
2. **Builder** -- action-oriented, implies building serious products
3. **Team** -- signals collaboration, which is the actual unlock

**Recommended: Pro** -- it is the industry standard for mid-tier pricing. Developers know what "Pro" means without reading the description.

#### What Is Included
- Everything in Community, plus:
- Private tool registry (publish internal tools visible only to your team)
- Priority tool indexing (new published tools indexed within minutes, not hours)
- Advanced analytics (install trends, dependency graphs, usage by team member)
- Uptime SLA (99.9% for registry API)
- Priority support (48-hour response via email)
- Team management (invite members, manage access)
- Webhook notifications (tool updates, security advisories)
- Custom quality scoring weights (prioritize what matters to your team)

#### Card Copy

**Pro** -- Most Popular
$29 / month per seat

For teams building production agents that need reliability, privacy, and control.

- Everything in Community
- Private tool registry
- Priority indexing
- Advanced analytics
- 99.9% uptime SLA
- Priority support (48h)
- Team management
- Webhooks and notifications

[Start 14-Day Free Trial]

#### Anchor Pricing Strategy

$29/month is positioned to feel trivially cheap compared to:
- The hourly cost of a developer maintaining custom MCP servers (~$75-150/hr)
- Composio's usage-based pricing (which scales unpredictably)
- The implicit cost of downtime when agents lose tool access

Frame the price against developer time: "At $29/month, TPMJS Pro pays for itself if it saves your team 15 minutes per month. Most teams save hours."

#### "Most Popular" Badge Psychology

The "Most Popular" badge serves two functions:
1. **Social proof:** Other teams chose this tier. You should too.
2. **Anchoring redirect:** Visitors who glance at Enterprise pricing ($299) perceive Pro ($29) as a bargain. The badge confirms the bargain is the right choice for most people.

Place the Pro card in the center position, visually elevated or highlighted with a border/badge. The eye should land here first.

---

### Enterprise Tier

#### Name Suggestions
1. **Enterprise** -- the standard. No one misreads it.
2. **Scale** -- implies growth and volume, less corporate feel
3. **Platform** -- positions TPMJS as infrastructure, not just a tool

**Recommended: Enterprise** -- for this tier, clarity beats creativity. Decision-makers scanning the page need to identify "this is for us" instantly.

#### What Is Included
- Everything in Pro, plus:
- SSO / SAML authentication
- Audit logs (who installed what, when, where)
- Role-based access control (admin, developer, viewer)
- Custom SLA (99.99% available)
- Dedicated support engineer
- On-premises registry option (air-gapped environments)
- Compliance certifications (SOC 2 Type II, GDPR)
- Custom integrations and onboarding
- Volume licensing (unlimited seats)
- Invoice billing (NET 30/60)

#### Card Copy

**Enterprise**
Custom pricing

For organizations that need security, compliance, and dedicated support at scale.

- Everything in Pro
- SSO / SAML
- Audit logs
- Role-based access control
- 99.99% SLA available
- Dedicated support engineer
- On-premises option
- SOC 2 Type II, GDPR
- Custom onboarding
- Volume licensing

[Contact Sales]

#### "Contact Sales" vs Self-Serve

Use "Contact Sales" for Enterprise. The reasons:

1. **Deal size justifies sales involvement.** Enterprise deals are $10K-100K+ annually. A sales conversation extracts more value than a checkout page.
2. **Qualification matters.** Not every company clicking "Enterprise" is an enterprise buyer. Sales calls filter tire-kickers from real prospects.
3. **Custom pricing flexibility.** Enterprise needs vary wildly. A fixed price either leaves money on the table or scares off smaller enterprises.
4. **Procurement requires it.** Large organizations have purchasing processes that require vendor contact, security reviews, and contract negotiation. "Contact Sales" matches their workflow.

Include a secondary CTA below the button: "Or start with Pro and upgrade anytime" -- this catches enterprise visitors who want to try before engaging sales.

---

## Supporting Copy

### FAQ for Pricing Page

**1. Is the Community tier really free forever?**
Yes. The Community tier is free with no time limit, no credit card required, and no feature degradation over time. The public registry, tool installation, and publishing will always be free. TPMJS is built on npm and the MCP open standard -- we are committed to keeping the core open.

**2. What happens if I exceed the Community tier limits?**
The Community tier has no hard limits on installs or publishing. If your usage patterns suggest you would benefit from Pro features (private registry, analytics, SLA), we will reach out with a recommendation. We will never throttle or restrict free tier access.

**3. Can I switch plans at any time?**
Yes. Upgrade or downgrade at any time. When upgrading, you get immediate access to new features and pay a prorated amount. When downgrading, your current billing period completes and the change takes effect at renewal.

**4. Do you offer a free trial for Pro?**
Yes. Pro includes a 14-day free trial with full access to all Pro features. No credit card required to start the trial.

**5. How does per-seat pricing work?**
Each team member who accesses the TPMJS dashboard, publishes tools, or uses private registry features counts as a seat. CI/CD pipelines and automated systems that only install public packages do not count as seats.

**6. What payment methods do you accept?**
Credit card (Visa, Mastercard, Amex) and PayPal for monthly and annual plans. Enterprise customers can pay via invoice (NET 30 or NET 60 terms).

**7. Is there a discount for annual billing?**
Yes. Annual billing saves 20% compared to monthly. That brings Pro from $29/month down to $23/month (billed annually at $276).

**8. What is your refund policy?**
We offer a full refund within 30 days of any paid plan purchase, no questions asked. If TPMJS is not the right fit, we will process your refund and help you export any data.

### Guarantee / Risk Reversal Copy

**Our Promise: 30-Day Money-Back Guarantee**

Try any paid plan risk-free for 30 days. If TPMJS does not save your team time and make your agents more capable, email us and we will refund every cent. No forms. No hoops. No questions.

We can offer this because teams that try TPMJS do not leave. The tools get embedded in codebases, agents get built, and the value compounds. We are that confident.

### Annual vs Monthly Toggle Messaging

**Toggle label:** Monthly | Annual (Save 20%)

**When annual is selected, show under the Pro price:**
$23/mo billed annually ($276/year) -- Save $72

**Nudge copy near the toggle:**
"Most teams choose annual. It is the same commitment as two lattes a week."

### "Compare Plans" Section

| Feature | Community | Pro | Enterprise |
|---|:---:|:---:|:---:|
| Public registry access | Yes | Yes | Yes |
| Unlimited installs | Yes | Yes | Yes |
| Publish tools | Yes | Yes | Yes |
| MCP protocol support | Yes | Yes | Yes |
| Quality scores and search | Yes | Yes | Yes |
| Private tool registry | -- | Yes | Yes |
| Priority indexing | -- | Yes | Yes |
| Advanced analytics | -- | Yes | Yes |
| Team management | -- | Yes | Yes |
| Webhooks | -- | Yes | Yes |
| Custom quality weights | -- | Yes | Yes |
| Uptime SLA | -- | 99.9% | 99.99% |
| Support | Community | Priority (48h) | Dedicated engineer |
| SSO / SAML | -- | -- | Yes |
| Audit logs | -- | -- | Yes |
| Role-based access control | -- | -- | Yes |
| On-premises option | -- | -- | Yes |
| Compliance (SOC 2, GDPR) | -- | -- | Yes |
| Volume licensing | -- | -- | Yes |
| Invoice billing | -- | -- | Yes |

---

## Pricing Psychology Applied

### Charm Pricing vs Round Numbers

**Community: $0** -- Round number. Free is free. No psychology needed.

**Pro: $29/month** -- Charm pricing. $29 reads as "twenty-something" rather than "thirty." The brain anchors on the left digit. $29 feels meaningfully cheaper than $30, even though the difference is $1.

**Enterprise: Custom** -- No number displayed. This is intentional. Displaying a high anchor number ($299, $499) can scare off mid-market companies. "Custom" signals flexibility and invites conversation. The actual price is negotiated based on seats and requirements.

**Annual Pro: $23/month** -- Charm pricing again. $23 anchors on "twenty" and the savings from $29 feel tangible. The "$276/year" total is shown smaller -- yearly totals trigger loss aversion more than monthly amounts.

### Decoy Effect Setup

The three-tier structure creates a natural decoy pattern:

- **Community ($0)** is the low anchor. It establishes that TPMJS has real value at zero cost.
- **Pro ($29)** is the target. It is where we want most paying customers.
- **Enterprise (Custom / high)** is the decoy. Its presence makes Pro feel like a bargain by contrast.

Without Enterprise, Pro would feel expensive ("$29/month for a tool registry?"). With Enterprise visible, Pro feels like a deal ("$29/month instead of custom enterprise pricing? Easy choice.").

**Visual reinforcement:**
- Community card: standard styling, no emphasis
- Pro card: highlighted border, "Most Popular" badge, slightly larger or elevated
- Enterprise card: standard styling, premium feel but no urgency

The eye is drawn to Pro. The comparison with Enterprise confirms it is the right choice. The comparison with Community confirms it is worth paying for.

### Anchoring Sequence

Control the order in which the brain processes prices:

1. **First impression: Enterprise (high anchor).** Even if the visitor does not read the Enterprise details, seeing "Contact Sales" and a feature list that includes SSO, compliance, and dedicated support establishes that TPMJS is enterprise-grade software. This sets a high value anchor.

2. **Second impression: Pro ($29).** After processing "enterprise-grade," $29/month feels almost trivially cheap. The contrast is stark and intentional.

3. **Third impression: Community ($0).** The free tier confirms that TPMJS is generous and confident. "They give this much away for free? The paid tiers must be outstanding."

**Implementation:** Display tiers left-to-right as Community | Pro | Enterprise on desktop, but the "Most Popular" badge and visual emphasis on Pro ensures it captures attention first regardless of reading order. On mobile (vertical stack), display Pro first, then Community, then Enterprise.

### Loss Aversion in Upgrade Messaging

People are more motivated by avoiding loss than achieving gain. Upgrade prompts should frame the decision as avoiding loss, not gaining features.

**Instead of (gain framing):**
"Upgrade to Pro and get private registries, analytics, and SLA."

**Use (loss framing):**
"Your team installed 47 tools last month. Without Pro, you have no visibility into which ones are outdated or vulnerable."

**Specific loss-aversion triggers for upgrade prompts:**

| Trigger Event | Loss-Framed Message |
|---|---|
| User publishes 5+ tools | "Your tools have 2,300 installs this month. Without Pro analytics, you cannot see who is using them or how." |
| Team adds 3rd member | "3 team members are publishing tools to the public registry. Without Pro, anyone can see your internal tools." |
| Tool gets 1,000+ installs | "Your tool hit 1,000 installs. Without Pro, you are missing download trends, dependency data, and team usage." |
| Outage or slow response | "Registry response times spiked to 2.3s today. Pro includes a 99.9% uptime SLA to keep your agents running." |
| Security advisory published | "A security advisory was published for a tool your team uses. Pro webhooks notify you instantly." |

**Downgrade friction (ethical):**
When a Pro user considers downgrading, show what they will lose with specific data:
"If you downgrade, you will lose access to your private registry (12 internal tools), analytics history (6 months of data), and your 99.9% SLA. Your team of 5 will revert to community support."

This is not manipulative -- it is informative. Users should understand the concrete impact of downgrading before they confirm.
