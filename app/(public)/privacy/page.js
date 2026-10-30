import Link from 'next/link';
import { ContactLine, LegalPage } from '@/components/legal/LegalPage';

export const metadata = {
  title: 'Privacy policy',
  description: 'What Halo collects, why, who can see it and how to have it changed or removed.',
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy">
      <p>
        This page explains what Halo collects when you use this website, why we need it, who can see it and how to
        have it changed or removed. Halo connects people with independent studios, equipment rental shops and event
        filming crews; each provider runs their own business. We aim to handle personal data in line with the data
        protection laws of the countries Halo operates in, including Ethiopia&apos;s Personal Data Protection
        Proclamation (No. 1321/2024) and Kenya&apos;s Data Protection Act, 2019.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Your account:</strong> your name, email address, phone number, country and, if you add one, a
          profile photo. Your password is stored only as a one-way hash, never in readable form. If you sign in with
          Google, we receive your name, email address and profile picture from Google, and nothing else.
        </li>
        <li>
          <strong>Bookings, quote requests and purchases:</strong> what you booked or asked for, the dates and times,
          prices, any notes you write, and their status. We also keep reviews and disputes you open.
        </li>
        <li>
          <strong>Providers:</strong> the storefront details a provider publishes (name, description, photos,
          location, opening hours and contact numbers) and their listings.
        </li>
        <li>
          <strong>On your device only:</strong> a sign-in cookie, a booking you have started but not sent, and small
          preferences (such as which storefront a provider is managing). These stay in your browser.
        </li>
      </ul>

      <h2>Why we use it</h2>
      <ul>
        <li>To make bookings, quotes and purchases work between you and the provider.</li>
        <li>So you and the provider can contact each other about a booking.</li>
        <li>To keep you signed in and protect accounts (for example, locking sign-in after repeated wrong passwords).</li>
        <li>To approve providers and listings, settle disputes and keep records of Halo&apos;s fees.</li>
      </ul>
      <p>We do not sell your data, and we do not use advertising or tracking cookies.</p>

      <h2>Who can see it</h2>
      <ul>
        <li>
          <strong>Everyone</strong> sees approved storefronts and listings, and the name and photo on reviews. Other
          people&apos;s bookings appear only as busy times, without names.
        </li>
        <li>
          <strong>A provider</strong> sees the name, email and phone number of customers who book, request a quote
          from or buy from them, along with those requests.
        </li>
        <li>
          <strong>You</strong> see the contact details of the providers you have dealt with.
        </li>
        <li>
          <strong>Halo administrators</strong> can see accounts and bookings to run and support the service. Regional
          administrators see only those in their own country.
        </li>
      </ul>
      <p>We use these services to run Halo, and they process data only for that purpose:</p>
      <ul>
        <li>
          <strong>Supabase</strong> stores accounts and bookings and handles Google sign-in.
        </li>
        <li>
          <strong>Vercel</strong> hosts the website.
        </li>
        <li>
          <strong>Google</strong> is used only if you choose to sign in with Google.
        </li>
        <li>
          <strong>Map services</strong> (OpenStreetMap) show provider locations. They do not receive your name or
          contact details.
        </li>
      </ul>

      <h2>How long we keep it</h2>
      <p>
        Bookings and payments are kept as business records. Accounts are kept until you ask us to delete them. When an
        account is deleted we remove your name, email address and phone number, and keep only anonymous totals needed
        for the records.
      </p>

      <h2>Your rights</h2>
      <p>
        You can ask what data we hold about you, ask us to correct it, or ask us to delete your account: <ContactLine />.
        You can change your name, photo, phone number and password yourself on your{' '}
        <Link href="/account">profile</Link>.
      </p>

      <h2>Changes</h2>
      <p>If we change this policy we will update the date at the top of this page.</p>
    </LegalPage>
  );
}
