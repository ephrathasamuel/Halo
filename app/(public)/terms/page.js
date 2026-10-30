import Link from 'next/link';
import { ContactLine, LegalPage } from '@/components/legal/LegalPage';

export const metadata = {
  title: 'Terms of use',
  description: 'The rules for booking, renting and providing through Halo.',
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of use">
      <p>
        By using Halo you agree to these terms. Halo is a marketplace: it connects customers with independent studios,
        equipment rental shops and event filming crews (&quot;providers&quot;). Each provider runs their own business
        and is responsible for what they offer.
      </p>

      <h2>Accounts</h2>
      <ul>
        <li>Give your real name and contact details, and keep your password to yourself.</li>
        <li>You are responsible for what is done with your account.</li>
        <li>We may suspend accounts that break these terms, give false details or misuse the service.</li>
      </ul>

      <h2>Booking</h2>
      <ul>
        <li>
          A booking request is confirmed only when the provider accepts it. Prices, deposits and availability are set
          by the provider, in their own currency.
        </li>
        <li>Halo adds a 10% service fee to the rental subtotal, shown before you send a request.</li>
        <li>
          Deposits are held for equipment and returned when it comes back in the condition it left. Damage or loss may
          be taken from the deposit.
        </li>
        <li>Arrive on time and use spaces and equipment with care. You are responsible for anyone you bring with you.</li>
        <li>Cancellations follow what the booking page and the provider state.</li>
      </ul>

      <h2>Providers</h2>
      <ul>
        <li>Describe your space, gear and services honestly, with real photos and prices.</li>
        <li>Honour bookings you accept, and keep your calendar up to date.</li>
        <li>Storefronts and listings are reviewed by Halo before they go live and can be removed if they break these terms.</li>
      </ul>

      <h2>Reviews and disputes</h2>
      <ul>
        <li>Reviews must be about a real booking and must be honest and respectful.</li>
        <li>
          If something goes wrong, open a dispute from the booking. A Halo administrator will look at both sides and
          decide, including what happens with the deposit.
        </li>
      </ul>

      <h2>Not allowed</h2>
      <ul>
        <li>Illegal, unsafe or offensive content or activity.</li>
        <li>Arranging bookings found on Halo outside Halo to avoid the service fee.</li>
        <li>Trying to access other people&apos;s accounts or data, or to disrupt the service.</li>
      </ul>

      <h2>Liability</h2>
      <p>
        Halo provides the marketplace as it is. The agreement for a booking is between the customer and the provider;
        Halo is not responsible for a provider&apos;s premises, equipment or work, nor for a customer&apos;s use of
        them, except where the law says otherwise.
      </p>

      <h2>Your data</h2>
      <p>
        How we handle personal data is explained in the <Link href="/privacy">privacy policy</Link>.
      </p>

      <h2>Contact and changes</h2>
      <p>
        Questions about these terms: <ContactLine />. If we change them we will update the date at the top of this page.
      </p>
    </LegalPage>
  );
}
