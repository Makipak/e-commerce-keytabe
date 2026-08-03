import { Link } from "react-router";

export const Title = ({ collapsed }: { collapsed: boolean }) => (
  <Link
    to="/"
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: collapsed ? "center" : "flex-start",
      height: 64,
      paddingInline: collapsed ? 0 : 24,
    }}
  >
    {collapsed ? (
      <img
        src="/brand/aissential-logomark.svg"
        alt="Aissential"
        style={{ width: 24, height: 24 }}
      />
    ) : (
      <img
        src="/brand/aissential-logotype-navy.svg"
        alt="Aissential"
        style={{ height: 22, width: "auto" }}
      />
    )}
  </Link>
);
