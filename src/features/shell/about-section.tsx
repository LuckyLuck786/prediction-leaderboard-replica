import Link from "next/link";

export interface AboutQuestion {
  question: string;
  answer: string;
}

/** POLY-02 / KAL-08: a short explainer under a board, with links onward. */
export function AboutSection({
  heading,
  intro,
  questions,
  links,
}: {
  heading: string;
  intro: string;
  questions: readonly AboutQuestion[];
  links: ReadonlyArray<{ label: string; href: string }>;
}) {
  return (
    <section className="mt-12 space-y-4 text-sm text-muted-foreground">
      <h2 className="text-base text-foreground">{heading}</h2>
      <p>{intro}</p>
      {questions.map((item) => (
        <div key={item.question}>
          <h3 className="text-sm text-foreground">{item.question}</h3>
          <p className="leading-5">{item.answer}</p>
        </div>
      ))}
      <p>
        See also:{" "}
        {links.map((link, index) => (
          <span key={link.href}>
            {index > 0 ? ", " : null}
            <Link href={link.href} className="underline hover:text-foreground">
              {link.label}
            </Link>
          </span>
        ))}
        .
      </p>
    </section>
  );
}
