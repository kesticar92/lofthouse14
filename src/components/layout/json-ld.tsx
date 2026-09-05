export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function JsonLdGraph({ items }: { items: unknown[] }) {
  return (
    <>
      {items.map((item, index) => (
        <JsonLd key={index} data={item} />
      ))}
    </>
  );
}
