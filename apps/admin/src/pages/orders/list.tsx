import { List, useTable, ShowButton } from "@refinedev/antd";
import { Table, Tag, Select } from "antd";
import { ORDER_STATUSES } from "@keytabee/shared";

const STATUS_COLOR: Record<string, string> = {
  PENDING: "orange",
  PAID: "green",
  PROCESSING: "blue",
  SHIPPED: "geekblue",
  COMPLETED: "green",
  CANCELLED: "red",
  EXPIRED: "default",
};

export function OrderList() {
  const { tableProps, setFilters } = useTable({ resource: "orders" });

  return (
    <List
      title="Order"
      headerButtons={
        <Select
          allowClear
          placeholder="Filter status"
          style={{ width: 180 }}
          options={ORDER_STATUSES.map((s) => ({ value: s, label: s }))}
          onChange={(value) =>
            setFilters([{ field: "status", operator: "eq", value: value ?? "" }])
          }
        />
      }
    >
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="orderNumber" title="No. Order" />
        <Table.Column dataIndex="guestName" title="Pembeli" />
        <Table.Column dataIndex="guestPhone" title="WhatsApp" />
        <Table.Column
          dataIndex="total"
          title="Total"
          render={(v: number) => `Rp${v.toLocaleString("id-ID")}`}
        />
        <Table.Column
          dataIndex="status"
          title="Status"
          render={(v: string) => <Tag color={STATUS_COLOR[v]}>{v}</Tag>}
        />
        <Table.Column
          dataIndex="createdAt"
          title="Tanggal"
          render={(v: string) => new Date(v).toLocaleString("id-ID")}
        />
        <Table.Column
          title="Aksi"
          render={(_, record: { id: string }) => (
            <ShowButton hideText size="small" recordItemId={record.id} />
          )}
        />
      </Table>
    </List>
  );
}
