/** 구조화 데이터(JSON-LD). '<'를 이스케이프해 상품명 등에 든 </script>로 태그가 깨지지 않게 한다 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
