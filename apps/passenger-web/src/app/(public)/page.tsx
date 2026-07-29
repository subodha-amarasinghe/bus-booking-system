import Link from 'next/link';

export default function LandingPage() {
  return (
    <main>
      <section className="hero">
        <h1>Your next bus is a few taps away.</h1>
        <p>Search routes, choose live seats, and pay securely from any device.</p>
      </section>
      <section className="card">
        <form className="search-form" action="/search" method="get">
          <label>
            From location ID
            <input name="originLocationId" placeholder="Origin UUID" />
          </label>
          <label>
            To location ID
            <input name="destinationLocationId" placeholder="Destination UUID" />
          </label>
          <label>
            Departure
            <input name="departureDate" type="date" />
          </label>
          <button type="submit">Find trips</button>
        </form>
      </section>
      <p className="muted">
        Already booked? <Link href="/login">Sign in to manage your trip</Link>.
      </p>
    </main>
  );
}
