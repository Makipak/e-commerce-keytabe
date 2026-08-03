import { Edit, useForm } from "@refinedev/antd";
import {
  Button,
  Card,
  Form,
  Image,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  Upload,
  App as AntdApp,
} from "antd";
import { PlusOutlined, DeleteOutlined, UploadOutlined } from "@ant-design/icons";
import { useState } from "react";
import { CATEGORIES, COLORS, SIZES } from "@keytabee/shared";
import { apiRequest, uploadFile, imgSrc } from "../../providers/data-provider";

const colorOptions = Object.entries(COLORS).map(([value, label]) => ({ value, label }));

export function ProductEdit() {
  const { form, formProps, saveButtonProps, query } = useForm({ resource: "products" });
  const { message } = AntdApp.useApp();
  const product = query?.data?.data;
  const refetch = () => query?.refetch();
  const category = Form.useWatch("category", form);

  // ===== state form gambar =====
  const [imgMeta, setImgMeta] = useState({ colorCode: "BLK", view: "front", type: "flat" });
  const [uploading, setUploading] = useState(false);

  /** true jika slot kombinasi (warna, sisi, tipe) sudah terisi gambar */
  const slotFilled = (colorCode: string, view: string, type: string) =>
    (product?.images ?? []).some(
      (i: any) => i.colorCode === colorCode && i.view === view && i.type === type,
    );

  const handleUpload = async (file: File) => {
    if (!product) return false;
    setUploading(true);
    try {
      const { url } = await uploadFile(file);
      const result = await apiRequest(`/admin/products/${product.id}/images`, {
        method: "POST",
        body: JSON.stringify({ ...imgMeta, url, sortOrder: (product.images?.length ?? 0) }),
      });
      message.success(
        result.replaced
          ? `Gambar ${imgMeta.colorCode} ${imgMeta.view}/${imgMeta.type} DIGANTI dengan yang baru`
          : "Gambar ditambahkan",
      );
      refetch();
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setUploading(false);
    }
    return false; // cegah antd upload otomatis — kita handle sendiri
  };

  const deleteImage = async (imageId: string) => {
    try {
      await apiRequest(`/admin/products/images/${imageId}`, { method: "DELETE" });
      message.success("Gambar dihapus");
      refetch();
    } catch (e: any) {
      message.error(e.message);
    }
  };

  // ===== state form varian =====
  const [variantForm] = Form.useForm();
  const [addingVariant, setAddingVariant] = useState(false);

  const addVariant = async (values: any) => {
    if (!product) return;
    setAddingVariant(true);
    try {
      await apiRequest(`/admin/products/${product.id}/variants`, {
        method: "POST",
        body: JSON.stringify({
          colorCode: values.colorCode,
          colorName: COLORS[values.colorCode as keyof typeof COLORS],
          size: values.size,
          price: values.price ?? null,
          stock: values.stock ?? 0,
        }),
      });
      message.success("Varian ditambahkan");
      variantForm.resetFields();
      refetch();
    } catch (e: any) {
      message.error(e.message); // mis. SKU duplikat / kombinasi warna+size sudah ada
    } finally {
      setAddingVariant(false);
    }
  };

  const updateVariantField = async (variantId: string, data: Record<string, unknown>) => {
    try {
      await apiRequest(`/admin/products/variants/${variantId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      refetch();
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const deleteVariant = async (variantId: string) => {
    try {
      await apiRequest(`/admin/products/variants/${variantId}`, { method: "DELETE" });
      message.success("Varian dihapus");
      refetch();
    } catch (e: any) {
      // mis. varian punya riwayat order → backend menolak dgn pesan jelas
      message.error(e.message);
    }
  };

  return (
    <Edit saveButtonProps={saveButtonProps} title="Edit Produk">
      <Form
        {...formProps}
        layout="vertical"
        onValuesChange={(changed, all) => {
          if ("category" in changed && changed.category !== "OTH") {
            form.setFieldValue("categoryLabel", undefined);
          }
          formProps.onValuesChange?.(changed, all);
        }}
      >
        <Form.Item label="Nama" name="name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Kategori" name="category" rules={[{ required: true }]}>
          <Select
            options={Object.entries(CATEGORIES).map(([value, label]) => ({ value, label }))}
          />
        </Form.Item>
        {category === "OTH" && (
          <Form.Item
            label="Nama Kategori"
            name="categoryLabel"
            rules={[{ required: true, message: "isi nama kategorinya" }]}
            extra='Kategori "Lainnya" — nama ini yang tampil di admin & toko'
          >
            <Input placeholder="mis. Sweatpants, Tote Bag" />
          </Form.Item>
        )}
        <Form.Item label="Deskripsi" name="description">
          <Input.TextArea rows={4} />
        </Form.Item>
        <Form.Item label="Harga Dasar (Rp)" name="basePrice" rules={[{ required: true }]}>
          <InputNumber min={0} step={1000} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item label="Berat (gram)" name="weightGram" rules={[{ required: true }]}>
          <InputNumber min={1} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item label="Aktif" name="isActive" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>

      {/* ===== GAMBAR ===== */}
      <Typography.Title level={5} style={{ marginTop: 24 }}>
        Gambar
      </Typography.Title>
      <Card size="small">
        <Space wrap style={{ marginBottom: 12 }}>
          <Select
            value={imgMeta.colorCode}
            options={colorOptions}
            style={{ width: 130 }}
            onChange={(colorCode) => setImgMeta({ ...imgMeta, colorCode })}
          />
          <Select
            value={imgMeta.view}
            options={[
              { value: "front", label: "Depan" },
              { value: "back", label: "Belakang" },
            ]}
            style={{ width: 110 }}
            onChange={(view) => setImgMeta({ ...imgMeta, view })}
          />
          <Select
            value={imgMeta.type}
            options={[
              { value: "flat", label: "Flat (katalog)" },
              { value: "model", label: "Model" },
            ]}
            style={{ width: 140 }}
            onChange={(type) => setImgMeta({ ...imgMeta, type })}
          />
          <Upload
            accept=".png,.jpg,.jpeg,.webp"
            showUploadList={false}
            beforeUpload={handleUpload}
          >
            <Button icon={<UploadOutlined />} loading={uploading}>
              {slotFilled(imgMeta.colorCode, imgMeta.view, imgMeta.type)
                ? "Ganti Gambar"
                : "Upload"}
            </Button>
          </Upload>
          {slotFilled(imgMeta.colorCode, imgMeta.view, imgMeta.type) && (
            <Typography.Text type="warning">
              Slot ini sudah terisi — upload akan mengganti gambar lama
            </Typography.Text>
          )}
        </Space>

        <Space wrap>
          {(product?.images ?? []).map((img: any) => (
            <Card
              key={img.id}
              size="small"
              style={{ width: 140 }}
              cover={<Image src={imgSrc(img.url)} height={120} style={{ objectFit: "cover" }} />}
              actions={[
                <Popconfirm
                  key="del"
                  title="Hapus gambar ini?"
                  onConfirm={() => deleteImage(img.id)}
                >
                  <DeleteOutlined />
                </Popconfirm>,
              ]}
            >
              <Tag>{img.colorCode}</Tag>
              <Tag>{img.view}</Tag>
              <Tag>{img.type}</Tag>
            </Card>
          ))}
          {(product?.images ?? []).length === 0 && (
            <Typography.Text type="secondary">Belum ada gambar.</Typography.Text>
          )}
        </Space>
      </Card>

      {/* ===== VARIAN ===== */}
      <Typography.Title level={5} style={{ marginTop: 24 }}>
        Varian
      </Typography.Title>
      <Card size="small" style={{ marginBottom: 12 }}>
        <Form form={variantForm} layout="inline" onFinish={addVariant}>
          <Form.Item name="colorCode" rules={[{ required: true, message: "warna?" }]}>
            <Select placeholder="Warna" options={colorOptions} style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name="size" rules={[{ required: true, message: "size?" }]}>
            <Select
              placeholder="Size"
              options={SIZES.map((s) => ({ value: s, label: s }))}
              style={{ width: 90 }}
            />
          </Form.Item>
          <Form.Item name="price">
            <InputNumber placeholder="Harga override" min={0} style={{ width: 140 }} />
          </Form.Item>
          <Form.Item name="stock" initialValue={0}>
            <InputNumber placeholder="Stok" min={0} style={{ width: 90 }} />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            icon={<PlusOutlined />}
            loading={addingVariant}
          >
            Tambah
          </Button>
        </Form>
      </Card>

      <Table dataSource={product?.variants ?? []} rowKey="id" pagination={false} size="small">
        <Table.Column dataIndex="sku" title="SKU" />
        <Table.Column dataIndex="colorName" title="Warna" />
        <Table.Column dataIndex="size" title="Size" />
        <Table.Column
          dataIndex="price"
          title="Harga Override"
          render={(v: number | null) => (v ? `Rp${v.toLocaleString("id-ID")}` : "—")}
        />
        <Table.Column
          dataIndex="stock"
          title="Stok"
          render={(v: number, record: any) => (
            <InputNumber
              size="small"
              min={0}
              defaultValue={v}
              onBlur={(e) => {
                const stock = Number((e.target as HTMLInputElement).value);
                if (stock !== v) updateVariantField(record.id, { stock });
              }}
            />
          )}
        />
        <Table.Column
          title=""
          width={50}
          render={(_, record: any) => (
            <Popconfirm
              title={`Hapus varian ${record.sku}?`}
              onConfirm={() => deleteVariant(record.id)}
            >
              <Button danger size="small" icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        />
      </Table>
    </Edit>
  );
}
