import { List, useTable, EditButton, DeleteButton } from "@refinedev/antd";
import { Table, Tag, Space, Input } from "antd";
import { CATEGORIES } from "@keytabee/shared";

export function ProductList() {
  const { tableProps, setFilters } = useTable({ resource: "products" });

  return (
    <List
      title="Produk"
      headerButtons={({ defaultButtons }) => (
        <Space>
          <Input.Search
            placeholder="Cari nama / SKU..."
            allowClear
            style={{ width: 240 }}
            onSearch={(value) =>
              setFilters([{ field: "search", operator: "eq", value }])
            }
          />
          {defaultButtons}
        </Space>
      )}
    >
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="name" title="Nama" />
        <Table.Column
          dataIndex="category"
          title="Kategori"
          render={(v: keyof typeof CATEGORIES) => CATEGORIES[v] ?? v}
        />
        <Table.Column
          dataIndex="basePrice"
          title="Harga"
          render={(v: number) => `Rp${v.toLocaleString("id-ID")}`}
        />
        <Table.Column
          dataIndex="variants"
          title="Total Stok"
          render={(variants: { stock: number }[]) =>
            variants?.reduce((s, v) => s + v.stock, 0) ?? 0
          }
        />
        <Table.Column
          dataIndex="isActive"
          title="Status"
          render={(v: boolean) =>
            v ? <Tag color="green">Aktif</Tag> : <Tag>Nonaktif</Tag>
          }
        />
        <Table.Column
          title="Aksi"
          render={(_, record: { id: string }) => (
            <Space>
              <EditButton hideText size="small" recordItemId={record.id} />
              <DeleteButton
                hideText
                size="small"
                recordItemId={record.id}
                confirmTitle="Hapus produk ini?"
                successNotification={(data: any) =>
                  data?.data?.deleted
                    ? {
                        type: "success",
                        message: "Produk dihapus permanen",
                        description: "Belum ada riwayat order untuk produk ini.",
                      }
                    : {
                        type: "success",
                        message: "Produk dinonaktifkan (tidak tampil di toko)",
                        description: `Punya ${data?.data?.orderCount ?? ""} riwayat order — tidak bisa dihapus permanen demi integritas laporan.`,
                      }
                }
              />
            </Space>
          )}
        />
      </Table>
    </List>
  );
}
