import { Create, useForm } from "@refinedev/antd";
import { Form, Input, InputNumber, Select, Switch } from "antd";
import { CATEGORIES } from "@keytabee/shared";

export function ProductCreate() {
  // Setelah simpan → langsung ke halaman edit untuk tambah varian & gambar
  // (gambar butuh productId, jadi produk harus tersimpan dulu)
  const { formProps, saveButtonProps } = useForm({ resource: "products", redirect: "edit" });

  return (
    <Create saveButtonProps={saveButtonProps} title="Tambah Produk">
      <Form {...formProps} layout="vertical">
        <Form.Item label="Nama" name="name" rules={[{ required: true }]}>
          <Input placeholder="Hoodie Box Logo" />
        </Form.Item>
        <Form.Item
          label="Slug"
          name="slug"
          rules={[{ required: true, pattern: /^[a-z0-9-]+$/, message: "huruf kecil & strip saja" }]}
        >
          <Input placeholder="hoodie-box-logo" />
        </Form.Item>
        <Form.Item label="Kategori" name="category" rules={[{ required: true }]}>
          <Select
            options={Object.entries(CATEGORIES).map(([value, label]) => ({ value, label }))}
          />
        </Form.Item>
        <Form.Item label="Deskripsi" name="description">
          <Input.TextArea rows={4} />
        </Form.Item>
        <Form.Item label="Harga Dasar (Rp)" name="basePrice" rules={[{ required: true }]}>
          <InputNumber min={0} step={1000} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          label="Berat (gram)"
          name="weightGram"
          rules={[{ required: true }]}
          extra="Untuk hitung ongkir. Kaos ±250g, hoodie ±650g."
        >
          <InputNumber min={1} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item label="Aktif" name="isActive" valuePropName="checked" initialValue={true}>
          <Switch />
        </Form.Item>
      </Form>
    </Create>
  );
}
