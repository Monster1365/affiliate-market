import { ImageResponse } from "next/og";

// 사이트 기본 공유 미리보기 이미지 (상품 페이지는 상품 이미지를 사용)
// 기본 글꼴에 한글이 없어 영문만 사용
export const alt = "ELI 엘리마켓";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 96px",
          background: "linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%)",
          color: "white",
        }}
      >
        <div style={{ fontSize: 180, fontWeight: 800, letterSpacing: 8, lineHeight: 1 }}>ELI</div>
        <div style={{ marginTop: 32, fontSize: 48, color: "#dbeafe" }}>Curated picks from Coupang</div>
      </div>
    ),
    size,
  );
}
