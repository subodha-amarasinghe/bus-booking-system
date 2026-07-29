export default function PaymentPage({
  params,
  searchParams,
}: {
  params: { bookingId: string };
  searchParams: { checkoutUrl?: string };
}) {
  const checkoutUrl = searchParams.checkoutUrl;
  return (
    <main className="stack">
      <div>
        <h1>Payment</h1>
        <p className="muted">Booking {params.bookingId}</p>
      </div>
      {checkoutUrl ? (
        <iframe
          title="Secure hosted payment checkout"
          src={checkoutUrl}
          allow="payment"
        />
      ) : (
        <section className="card">
          <p>The payment service has not returned a hosted checkout URL yet.</p>
        </section>
      )}
    </main>
  );
}
