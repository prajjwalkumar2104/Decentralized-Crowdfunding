"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "What is Quadratic Funding (QF)?",
    a: "QF is a democratic way to distribute matching funds. It calculates matching based on the number of unique contributors rather than just the total amount of money. This ensures that a project supported by 100 people giving $1 receives more matching than a project supported by 1 person giving $100.",
  },
  {
    q: "What is 'All-or-Nothing' funding?",
    a: "If a project does not reach its minimum funding goal by the end of the round, all contributions are automatically refunded to the donors. This ensures contributors only fund projects that have enough capital to actually succeed.",
  },
  {
    q: "What is Retroactive Public Goods Funding (RPGF)?",
    a: "RPGF rewards projects that have *already* provided value to the ecosystem. Instead of funding a promise, the community votes to reward impact that has already been delivered, encouraging long-term sustainability.",
  },
  {
    q: "How do I know my donation is secure?",
    a: "Every transaction happens on-chain via audited smart contracts. RadiantFund never holds your private keys, and matching funds are held in a transparent treasury contract that anyone can inspect on the blockchain.",
  },
  {
    q: "Can I cancel my contribution?",
    a: "During an active funding round, contributions are generally locked. However, if the project fails to meet its goals or milestones, the 'All-or-Nothing' logic or the milestone-protection smart contract will allow you to reclaim your remaining funds.",
  },
  {
    q: "Is RadiantFund secure?",
    a: "Yes, all funds are handled via smart contracts. We use milestone-based releases to ensure project owners only receive funds as they deliver on their promises.",
  },
  {
    q: "What is the platform fee?",
    a: "We charge 2.5% only on matching funds. Direct community donations have 0% platform fees.",
  },
];

export default function FAQSection() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight">FAQ</h2>
          <p className="text-muted-foreground mt-2">
            Quick answers to common questions about RadiantFund.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`} 
              className="glass-card px-6 rounded-xl border-none"
            >
              <AccordionTrigger className="text-sm font-medium hover:no-underline hover:text-primary transition-colors">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}