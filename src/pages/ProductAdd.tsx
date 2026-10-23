import React, { useState, useEffect, useCallback } from "react";
import Layout from "./Layout";
import { useHistory } from "react-router-dom";
import { apiGet } from "../api";

const responsiveStyles = `
  *, *::before, *::after { box-sizing: border-box; }

  .form-section-title {
    font-size: 13px;
    font-weight: 600;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 24px 0 12px;
    padding-bottom: 6px;
    border-bottom: 1px solid #F0F0EA;
  }
  .form-grid-4 {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 18px;
  }
  .form-grid-3 {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    gap: 16px;
    margin-bottom: 18px;
  }
  .form-grid-4b {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 18px;
  }
  .form-grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 18px;
  }
  .form-grid-1 {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
    margin-bottom: 18px;
  }
  .field-group {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .field-label {
    font-size: 13px;
    font-weight: 500;
    color: #444;
  }
  .field-required {
    color: #e53e3e;
    margin-left: 2px;
  }
  .field-input {
    width: 100%;
    padding: 9px 12px;
    border: 1px solid #E0E0DA;
    border-radius: 8px;
    font-size: 14px;
    color: #222;
    background: #fff;
    outline: none;
    transition: border-color 0.2s;
  }
  .field-input:focus { border-color: #00B894; }
  .file-input-wrapper { position: relative; }
  .file-input-wrapper input[type="file"] {
    width: 100%;
    padding: 7px 12px;
    border: 1px dashed #C0C0BA;
    border-radius: 8px;
    font-size: 13px;
    background: #FAFAF8;
    cursor: pointer;
  }
  .file-input-wrapper input[type="file"]:focus {
    outline: none;
    border-color: #00B894;
  }
  .image-preview {
    margin-top: 8px;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .image-preview img {
    width: 64px;
    height: 64px;
    object-fit: cover;
    border-radius: 6px;
    border: 1px solid #E0E0DA;
  }
  @media (max-width: 768px) {
    .form-grid-4, .form-grid-3, .form-grid-4b { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 480px) {
    .form-grid-4, .form-grid-3, .form-grid-4b, .form-grid-2 { grid-template-columns: 1fr; }
  }
`;

type Category    = { id: number; name: string };
type Subcategory = { id: number; name: string; category_id: number };

type ProductFormData = {
  name: string;
  category_id: string;
  subcategory_id: string;
  quantity: string;
  details: string;
  price: string;
  mrp: string;
  section: string;
  tags: string;
  qtyLabel: string;
  description: string;
};

const EMPTY_FORM: ProductFormData = {
  name: "",
  category_id: "",
  subcategory_id: "",
  quantity: "",
  details: "",
  price: "",
  mrp: "",
  section: "Hot Deals",
  tags: "",
  qtyLabel: "",
  description: "",
};

const sectionMap: Record<string, string> = {
  "Hot Deals":    "hot_deals",
  "Fresh Needs":  "fresh_needs",
  "Best Sellers": "best_sellers",
  "New Arrivals": "new_arrivals",
};

const sections = Object.keys(sectionMap);

const Field: React.FC<{ label: string; required?: boolean; children: React.ReactNode }> = ({
  label, required, children,
}) => (
  <div className="field-group">
    <label className="field-label">
      {label}
      {required && <span className="field-required">*</span>}
    </label>
    {children}
  </div>
);

const ProductsAdd: React.FC = () => {
  const user = JSON.parse(localStorage.getItem("auth_user") || "null");
  const history = useHistory();                              // ✅ FIX 1

  const [form, setForm]             = useState<ProductFormData>(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [mainImage, setMainImage]   = useState<File | null>(null);
  const [extraImages, setExtraImages] = useState<File[]>([]);
  const [categories, setCategories]   = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

  const fetchDropdowns = useCallback(async () => {
    try {
      const [cat, sub] = await Promise.all([
        apiGet("/category-list"),
        apiGet("/subcategory-list"),
      ]);
      setCategories(cat.data ?? []);
      setSubcategories(sub.data ?? []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { fetchDropdowns(); }, [fetchDropdowns]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === "category_id") {
      setForm((prev) => ({ ...prev, category_id: value, subcategory_id: "" }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleMainImageChange  = (e: React.ChangeEvent<HTMLInputElement>) =>
    setMainImage(e.target.files?.[0] ?? null);

  const handleExtraImagesChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setExtraImages(Array.from(e.target.files ?? []));

  const handleSubmit = async () => {
    if (!form.name.trim())  { alert("Product Name is required.");  return; }
    if (!form.price.trim()) { alert("Price is required.");         return; }
    if (!form.category_id)  { alert("Please select a Category.");  return; }

    setSaving(true);
    try {
      const token = localStorage.getItem("auth_token") || "";

      const formData = new FormData();
      formData.append("name",           form.name.trim());
      formData.append("category_id",    form.category_id);
      formData.append("subcategory_id", form.subcategory_id);
      formData.append("quantity",       form.quantity);
      formData.append("details",        form.details);
      formData.append("price",          form.price);
      formData.append("mrp",            form.mrp);
      formData.append("section",        sectionMap[form.section] || form.section);
      formData.append("tags",           form.tags);
      formData.append("qty_label",      form.qtyLabel);
      formData.append("description",    form.description);
      formData.append("vendor_id",      String(user?.id ?? ""));
      if (mainImage) formData.append("image", mainImage);
      extraImages.forEach((img) => formData.append("images[]", img));

      const response = await fetch(
    "https://shriecom.in/appapis/shreefood/public/api/vendor/store",
    {
        method: "POST",
        headers: {
            Accept: "application/json",
            ...(token
                ? {
                      Authorization: `Bearer ${token}`,
                  }
                : {}),
        },
        body: formData,
    }
);

      const res = await response.json();

      if (!response.ok || !res.success) {
        if (res.errors) {
          const msgs = Object.values(res.errors as Record<string, string[]>)
            .flat()
            .join("\n");
          throw new Error(msgs);
        }
        throw new Error(res.message || "Failed to save product.");
      }

      setForm(EMPTY_FORM);
      setMainImage(null);
      setExtraImages([]);
      history.replace("/product-list");                      // ✅ FIX 2
    } catch (err) {
      alert(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const filteredSubs = subcategories.filter(
    (s) => String(s.category_id) === String(form.category_id)
  );

  return (
    <Layout title="Add Product" activeNav="Products">
      <style>{responsiveStyles}</style>

      <h2 style={{ marginBottom: 20 }}>Add Product</h2>

      <div style={{ background: "#fff", padding: 24, borderRadius: 10 }}>

        {/* ── Basic Info ── */}
        <p className="form-section-title">Basic Information</p>
        <div className="form-grid-4">
          <Field label="Product Name" required>
            <input className="field-input" name="name" value={form.name}
              onChange={handleChange} placeholder="e.g. Organic Almonds" />
          </Field>

          <Field label="Category" required>
            <select className="field-input" name="category_id"
              value={form.category_id} onChange={handleChange}>
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Subcategory">
            <select className="field-input" name="subcategory_id"
              value={form.subcategory_id} onChange={handleChange}
              disabled={!form.category_id}>
              <option value="">Select Subcategory</option>
              {filteredSubs.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Section" required>
            <select className="field-input" name="section"
              value={form.section} onChange={handleChange}>
              {sections.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
        </div>

        {/* ── Pricing & Stock ── */}
        <p className="form-section-title">Pricing & Stock</p>
        <div className="form-grid-3">
          <Field label="Details">
            <input className="field-input" name="details" value={form.details}
              onChange={handleChange} placeholder="e.g. 500g pack, roasted" />
          </Field>
          <Field label="Price (₹)" required>
            <input className="field-input" name="price" value={form.price}
              onChange={handleChange} placeholder="e.g. 299" type="number" min="0" />
          </Field>
          <Field label="MRP (₹)">
            <input className="field-input" name="mrp" value={form.mrp}
              onChange={handleChange} placeholder="e.g. 399" type="number" min="0" />
          </Field>
        </div>

        {/* ── Inventory ── */}
        <p className="form-section-title">Inventory</p>
        <div className="form-grid-4b">
          <Field label="Quantity" required>
            <input className="field-input" name="quantity" value={form.quantity}
              onChange={handleChange} placeholder="e.g. 50" type="number" min="0" />
          </Field>
          <Field label="Qty Label">
            <input className="field-input" name="qtyLabel" value={form.qtyLabel}
              onChange={handleChange} placeholder="e.g. kg, pcs, litre" />
          </Field>
          <Field label="Tags">
            <input className="field-input" name="tags" value={form.tags}
              onChange={handleChange} placeholder="e.g. organic, vegan" />
          </Field>
        </div>

        {/* ── Images ── */}
        <p className="form-section-title">Images</p>
        <div className="form-grid-2">
          <Field label="Main Product Image">
            <div className="file-input-wrapper">
              <input type="file" name="image" accept="image/*"
                onChange={handleMainImageChange} />
            </div>
            {mainImage && (
              <div className="image-preview">
                <img src={URL.createObjectURL(mainImage)} alt="Main preview" />
              </div>
            )}
          </Field>

          <Field label="Additional Images (multiple)">
            <div className="file-input-wrapper">
              <input type="file" name="images" accept="image/*" multiple
                onChange={handleExtraImagesChange} />
            </div>
            {extraImages.length > 0 && (
              <div className="image-preview">
                {extraImages.map((img, i) => (
                  <img key={i} src={URL.createObjectURL(img)} alt={`Extra ${i + 1}`} />
                ))}
              </div>
            )}
          </Field>
        </div>

        {/* ── Description ── */}
        <p className="form-section-title">Description</p>
        <div className="form-grid-1">
          <Field label="Product Description">
            <textarea className="field-input" name="description"
              value={form.description} onChange={handleChange}
              placeholder="Write a detailed product description…"
              style={{ height: 110, resize: "vertical" }} />
          </Field>
        </div>

        {/* ── Actions ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 8 }}>
          <button onClick={handleSubmit} disabled={saving}
            style={{
              padding: "10px 28px",
              background: saving ? "#ccc" : "#00B894",
              color: "#fff", border: "none", borderRadius: 6,
              fontWeight: 600, fontSize: 15,
              cursor: saving ? "not-allowed" : "pointer",
              transition: "background 0.2s",
            }}>
            {saving ? "Saving…" : "Save Product"}
          </button>

          <button
            onClick={() => history.replace("/product-list")}  // ✅ FIX 3
            disabled={saving}
            style={{
              padding: "10px 20px", background: "#fff",
              color: "#555", border: "1px solid #E0E0DA",
              borderRadius: 6, fontWeight: 500, fontSize: 15,
              cursor: "pointer",
            }}>
            Cancel
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default ProductsAdd;