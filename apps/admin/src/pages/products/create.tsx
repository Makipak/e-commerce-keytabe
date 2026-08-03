import { Create, useForm } from "@refinedev/antd";
import { useNavigation } from "@refinedev/core";
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
import { useRef, useState } from "react";
import { CATEGORIES, COLORS, SIZES } from "@keytabee/shared";
import { apiRequest, uploadFile, imgSrc } from "../../providers/data-provider";

const colorOptions = Object.entries(COLORS).map(([value, label]) => ({ value, label }));

const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

type StagedVariant = {
  key: string;
  colorCode: string;
  colorName: string;
  size: string;
  price: number | null;
  stock: number;
};

type StagedImage = { key: string; colorCode: string; view: string; type: string; url: string };

export function ProductCreate() {
  const { form, formProps, onFinish } = useForm({ resource: "products", redirect: false });
  const { edit } = useNavigation();
  const { message } = AntdApp.useApp();
  const category = Form.useWatch("category", form);

  // Slug ikut Nama otomatis sampai user mengetik slug sendiri secara manual
  const slugTouched = useRef(false);

  // Varian & gambar ditampung lokal dulu (backend butuh productId utk SKU & relasi,
  // yang baru ada setelah produk dibuat) — baru dikirim ke server sekaligus saat tombol
  // Simpan dipencet, jadi dari sisi user semuanya kelihatan langsung ada di 1 form.
  const [variants, setVariants] = useState<StagedVariant[]>([]);
  const [images, setImages] = useState<StagedImage[]>([]);
  const [imgMeta, setImgMeta] = useState({ colorCode: "BLK", view: "front", type: "flat" });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [variantForm] = Form.useForm();

  const slotFilled = (colorCode: string, view: string, type: string) =>
    images.some((i) => i.colorCode === colorCode && i.view === view && i.type === type);

  const addVariant = (values: any) => {
    const dup = variants.some((v) => v.colorCode === values.colorCode && v.size === values.size);
    if (dup) {
      message.error("Kombinasi warna + size ini sudah ditambahkan");
      return;
    }
    setVariants([
      ...variants,
      {
        key: crypto.randomUUID(),
        colorCode: values.colorCode,
        colorName: COLORS[values.colorCode as keyof typeof COLORS],
        size: values.size,
        price: values.price ?? null,
        stock: values.stock ?? 0,
      },
    ]);
    variantForm.resetFields();
  };

  const removeVariant = (key: string) => setVariants(variants.filter((v) => v.key !== key));

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const { url } = await uploadFile(file);
      const replaced = slotFilled(imgMeta.colorCode, imgMeta.view, imgMeta.type);
      setImages([
        ...images.filter(
          (i) =>
            !(
              i.colorCode === imgMeta.colorCode &&
              i.view === imgMeta.view &&
              i.type === imgMeta.type
            ),
        ),
        { key: crypto.randomUUID(), ...imgMeta, url },
      ]);
      message.success(replaced ? "Gambar diganti dengan yang baru" : "Gambar ditambahkan");
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setUploading(false);
    }
    return false; // cegah antd upload otomatis — kita handle sendiri
  };

  const removeImage = (key: string) => setImages(images.filter((i) => i.key !== key));

  const handleSave = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      const result = await onFinish(values);
      const product = (result as any)?.data;
      if (!product?.id) throw new Error("Gagal membuat produk");
      for (const v of variants) {
        await apiRequest(`/admin/products/${product.id}/variants`, {
          method: "POST",
          body: JSON.stringify({
            colorCode: v.colorCode,
            colorName: v.colorName,
            size: v.size,
            price: v.price,
            stock: v.stock,
          }),
        });
      }
      for (const img of images) {
        await apiRequest(`/admin/products/${product.id}/images`, {
          method: "POST",
          body: JSON.stringify({ colorCode: img.colorCode, view: img.view, type: img.type, url: img.url }),
        });
      }
      message.success("Produk dibuat");
      edit("products", product.id);
    } catch (e: any) {
      message.error(e.message ?? "Gagal menyimpan produk");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Create saveButtonProps={{ onClick: handleSave, loading: submitting }} title="Tambah Produk">
      <Form
        {...formProps}
        layout="vertical"
        onValuesChange={(changed, all) => {
          if ("slug" in changed) {
            slugTouched.current = true;
          } else if ("name" in changed && !slugTouched.current) {
            form.setFieldValue("slug", slugify(changed.name ?? ""));
          }
          if ("category" in changed && changed.category !== "OTH") {
            form.setFieldValue("categoryLabel", undefined);
          }
          formProps.onValuesChange?.(changed, all);
        }}
      >
        <Form.Item label="Nama" name="name" rules={[{ required: true }]}>
          <Input placeholder="Hoodie Box Logo" />
        </Form.Item>
        <Form.Item
          label="Slug"
          name="slug"
          extra="Terisi otomatis dari Nama — bisa diubah manual kalau perlu"
          rules={[{ required: true, pattern: /^[a-z0-9-]+$/, message: "huruf kecil & strip saja" }]}
        >
          <Input placeholder="hoodie-box-logo" />
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
          {images.map((img) => (
            <Card
              key={img.key}
              size="small"
              style={{ width: 140 }}
              cover={<Image src={imgSrc(img.url)} height={120} style={{ objectFit: "cover" }} />}
              actions={[
                <Popconfirm
                  key="del"
                  title="Hapus gambar ini?"
                  onConfirm={() => removeImage(img.key)}
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
          {images.length === 0 && (
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
          <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
            Tambah
          </Button>
        </Form>
      </Card>

      <Table dataSource={variants} rowKey="key" pagination={false} size="small">
        <Table.Column dataIndex="colorName" title="Warna" />
        <Table.Column dataIndex="size" title="Size" />
        <Table.Column
          dataIndex="price"
          title="Harga Override"
          render={(v: number | null) => (v ? `Rp${v.toLocaleString("id-ID")}` : "—")}
        />
        <Table.Column dataIndex="stock" title="Stok" />
        <Table.Column
          title=""
          width={50}
          render={(_, record: StagedVariant) => (
            <Popconfirm title="Hapus varian ini?" onConfirm={() => removeVariant(record.key)}>
              <Button danger size="small" icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        />
      </Table>
    </Create>
  );
}
