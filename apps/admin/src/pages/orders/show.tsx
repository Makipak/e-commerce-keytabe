import { Show } from "@refinedev/antd";
import { useShow, useInvalidate } from "@refinedev/core";
import {
  Button,
  Descriptions,
  Input,
  Modal,
  Space,
  Table,
  Tag,
  App as AntdApp,
} from "antd";
import { useState } from "react";
import { apiRequest } from "../../providers/data-provider";

/** Transisi yang boleh dilakukan admin per status (mirror dari backend) */
const NEXT_ACTIONS: Record<string, { to: string; label: string; needWaybill?: boolean }[]> = {
  PENDING: [{ to: "CANCELLED", label: "Batalkan" }],
  PAID: [
    { to: "PROCESSING", label: "Proses Order" },
    { to: "CANCELLED", label: "Batalkan" },
  ],
  PROCESSING: [
    { to: "SHIPPED", label: "Kirim (input resi)", needWaybill: true },
    { to: "CANCELLED", label: "Batalkan" },
  ],
  SHIPPED: [{ to: "COMPLETED", label: "Selesai" }],
};

export function OrderShow() {
  const { query } = useShow({ resource: "orders" });
  const record: any = query?.data?.data;
  const invalidate = useInvalidate();
  const { message } = AntdApp.useApp();
  const [waybill, setWaybill] = useState("");
  const [modalFor, setModalFor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const updateStatus = async (status: string, wb?: string) => {
    if (!record) return;
    setLoading(true);
    try {
      await apiRequest(`/admin/orders/${record.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, ...(wb ? { waybill: wb } : {}) }),
      });
      message.success(`Status → ${status}`);
      setModalFor(null);
      await invalidate({ resource: "orders", invalidates: ["detail", "list"] });
      query.refetch();
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const actions = record ? (NEXT_ACTIONS[record.status as string] ?? []) : [];

  return (
    <Show title={`Order ${record?.orderNumber ?? ""}`} isLoading={query.isLoading}>
      {record && (
        <>
          <Space style={{ marginBottom: 16 }}>
            {actions.map((a) => (
              <Button
                key={a.to}
                danger={a.to === "CANCELLED"}
                type={a.to === "CANCELLED" ? "default" : "primary"}
                loading={loading}
                onClick={() => (a.needWaybill ? setModalFor(a.to) : updateStatus(a.to))}
              >
                {a.label}
              </Button>
            ))}
          </Space>

          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="Status">
              <Tag>{record.status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Total">
              Rp{Number(record.total).toLocaleString("id-ID")}
            </Descriptions.Item>
            <Descriptions.Item label="Pembeli">{record.guestName}</Descriptions.Item>
            <Descriptions.Item label="WhatsApp">{record.guestPhone}</Descriptions.Item>
            <Descriptions.Item label="Alamat" span={2}>
              {record.address}
            </Descriptions.Item>
            <Descriptions.Item label="Kurir">
              {String(record.courier).toUpperCase()} {record.courierService}
            </Descriptions.Item>
            <Descriptions.Item label="Resi">{record.waybill ?? "—"}</Descriptions.Item>
          </Descriptions>

          <Table
            dataSource={record.items}
            rowKey="id"
            pagination={false}
            size="small"
            style={{ marginTop: 16 }}
          >
            <Table.Column dataIndex="sku" title="SKU" />
            <Table.Column dataIndex="name" title="Item" />
            <Table.Column dataIndex="qty" title="Qty" />
            <Table.Column
              dataIndex="price"
              title="Harga"
              render={(v: number) => `Rp${v.toLocaleString("id-ID")}`}
            />
          </Table>

          <Modal
            open={modalFor !== null}
            title="Input No. Resi"
            onCancel={() => setModalFor(null)}
            onOk={() => updateStatus(modalFor!, waybill)}
            okButtonProps={{ disabled: !waybill, loading }}
          >
            <Input
              placeholder="Nomor resi kurir"
              value={waybill}
              onChange={(e) => setWaybill(e.target.value)}
            />
          </Modal>
        </>
      )}
    </Show>
  );
}
