import { ThemedTitleV2 } from "@refinedev/antd";

export const Title = ({ collapsed }: { collapsed: boolean }) => (
  <ThemedTitleV2
    collapsed={collapsed}
    text="Aissential Admin"
    icon={
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: 6,
          background: "#171717",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: 13,
        }}
      >
        K
      </div>
    }
  />
);
