import { SectionHeading } from "./section-heading";

const faqs = [
  {
    question: "Do my agents need to hold USDC or SOL?",
    answer:
      "No. Agents just include their wallet address in the request header as an identity proof. The vault funded by your Dodo subscription covers the budget. Agents never need to hold or sign any tokens.",
  },
  {
    question: "Do I need to understand Solana or crypto to use Quota?",
    answer:
      "No. Choose the managed wallet option during onboarding and Quota handles all the on-chain complexity. You interact only with a familiar SaaS dashboard and Dodo billing.",
  },
  {
    question: "What happens when an agent hits its quota?",
    answer:
      "The API returns HTTP 402 with a clear message including the reset date. The agent cannot call the API again until the monthly period resets or the vault owner increases the limit.",
  },
  {
    question: "Can I increase a seat limit mid-month?",
    answer:
      "Yes. The vault owner can update any seat limit at any time from the dashboard. The change is an on-chain transaction that takes effect immediately.",
  },
  {
    question: "What is a credit?",
    answer:
      "A credit is the unit of quota consumption. Different API routes cost different credits. A simple echo endpoint costs 1 credit. An AI generation endpoint costs 20 credits. You configure the cost per route.",
  },
  {
    question: "Is the on-chain data public?",
    answer:
      "The quota enforcement data is public on Solana. Anyone can verify that a consume transaction happened. The content of the API calls is not stored on-chain.",
  },
  {
    question: "What happens to unused vault USDC if I cancel?",
    answer:
      "You can withdraw remaining USDC from your vault to your wallet at any time from the billing dashboard. Cancellation never locks your funds.",
  },
];

export function FaqSection() {
  return (
    <section className="px-6 py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          label="FAQ"
          title="Questions teams ask before they switch"
          className="mb-10"
        />

        <div className="grid gap-4 lg:grid-cols-2">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-2xl border border-white/10 bg-white/4 p-5"
            >
              <summary className="cursor-pointer list-none text-base font-medium text-white marker:hidden">
                <span className="flex items-center justify-between gap-4">
                  {faq.question}
                  <span className="flex size-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition group-open:rotate-45">
                    +
                  </span>
                </span>
              </summary>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
