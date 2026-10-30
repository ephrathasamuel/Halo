import { CONTACT_EMAIL, LEGAL_UPDATED } from '@/lib/legal';

/** Layout for the privacy and terms pages: readable width, headings, lists and links. */
export function LegalPage({ title, children }) {
  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-[15px] leading-relaxed text-halo-ink/85 [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-halo-ink [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_a]:underline [&_a]:underline-offset-2 [&_a]:text-halo-ink [&_strong]:text-halo-ink">
      <h1 className="text-3xl sm:text-4xl font-semibold text-halo-ink">{title}</h1>
      <p className="mt-2 text-sm text-halo-text-muted">Last updated {LEGAL_UPDATED}</p>
      {children}
    </article>
  );
}

/** How to reach Halo about these pages. */
export function ContactLine() {
  return CONTACT_EMAIL ? (
    <>
      email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
    </>
  ) : (
    <>contact the Halo team</>
  );
}
