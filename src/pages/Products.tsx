import React, { useState, useEffect, useCallback } from "react";
import Layout from "./Layout";
import { apiDelete, apiGet } from '../api';
import { useHistory } from "react-router-dom";
import { toast } from 'react-toastify';

// ─── Responsive Styles ────────────────────────────────────────────────────────
const responsiveStyles = `
  *, *::before, *::after { box-sizing: border-box; }

  .products-header {
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 12px; margin-bottom: 20px;
  }
  .products-header-title { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
  .products-header-actions {
    display: flex; align-items: center; gap: 10px;
    flex-wrap: wrap; flex: 1; justify-content: flex-end; min-width: 0;
  }
  .products-search-box {
    display: flex; align-items: center; gap: 8px;
    background: #fff; border: 1px solid #E0E0DA;
    border-radius: 8px; padding: 6px 14px; width: 220px; min-width: 0;
  }
  .products-search-box input {
    border: none; background: transparent; outline: none;
    font-size: 13px; color: #333; width: 100%; min-width: 0;
  }

  /* ── Desktop Table ── */
  .products-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; width: 100%; }
  .products-table-wrap table { min-width: 860px; width: 100%; border-collapse: collapse; font-size: 13px; }
  .products-table-wrap th, .products-table-wrap td { padding: 12px 14px; white-space: nowrap; }
  .products-table-wrap th {
    text-align: left; font-weight: 600; color: #555;
    border-bottom: 1px solid #E8E8E4; background: #FAFAF8;
    position: sticky; top: 0; z-index: 1;
  }
  .products-table-wrap td { border-bottom: 1px solid #F0F0EA; color: #555; }

  /* ── Mobile Cards ── */
  .product-cards-grid {
    display: none;
    flex-direction: column;
    gap: 14px;
  }
  .product-card {
    background: #fff;
    border: 1px solid #E8E8E4;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  }
  .product-card-top {
    display: flex;
    gap: 12px;
    padding: 14px;
    align-items: flex-start;
  }
  .product-card-img {
    width: 64px; height: 64px;
    border-radius: 10px;
    object-fit: cover;
    flex-shrink: 0;
    background: #F0F0EA;
    display: flex; align-items: center; justify-content: center;
    font-size: 22px; color: #ccc;
    overflow: hidden;
  }
  .product-card-img img {
    width: 100%; height: 100%; object-fit: cover; display: block;
  }
  .product-card-info { flex: 1; min-width: 0; }
  .product-card-name {
    font-size: 15px; font-weight: 700; color: #1a1a1a;
    margin: 0 0 4px; white-space: nowrap;
    overflow: hidden; text-overflow: ellipsis;
  }
  .product-card-cat {
    font-size: 12px; color: #888; margin-bottom: 6px;
  }
  .product-card-price-row {
    display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  }
  .product-card-price {
    font-size: 16px; font-weight: 700; color: #00B894;
  }
  .product-card-mrp {
    font-size: 12px; color: #aaa; text-decoration: line-through;
  }
  .product-card-meta {
    display: flex; gap: 8px; flex-wrap: wrap;
    padding: 0 14px 12px;
  }
  .product-card-chip {
    background: #F5F5F0; color: #555;
    border-radius: 20px; padding: 3px 10px;
    font-size: 11px; font-weight: 500;
  }
  .product-card-footer {
    border-top: 1px solid #F0F0EA;
    padding: 10px 14px;
    display: flex; gap: 8px; justify-content: flex-end;
  }

  /* ── Visibility toggles ── */
  @media (max-width: 768px) {
    .products-desktop-table { display: none !important; }
    .product-cards-grid { display: flex !important; }
    .products-header { flex-direction: column; align-items: stretch; }
    .products-header-actions { justify-content: flex-start; width: 100%; }
    .products-search-box { width: 100%; flex: 1; }
  }

  @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
`;

// ─── Types ────────────────────────────────────────────────────────────────────
interface CategoryObj {
  id: number;
  name: string;
  slug?: string;
  image?: string;
  created_at?: string;
  updated_at?: string;
}

interface Product {
  id: number;
  image: string;
  galleryImages: string[];
  name: string;
  category: CategoryObj | string;
  subcategory: CategoryObj | string;
  price: number;
  mrp?: number;
  qty: number;
  section: string;
  tags: string;
  details: string;
  description: string;
}

// ─── Helper ───────────────────────────────────────────────────────────────────
const getName = (val: CategoryObj | string | undefined | null): string => {
  if (!val) return "–";
  if (typeof val === "object") return val.name || "–";
  return val;
};

// ─── Section Badge ────────────────────────────────────────────────────────────
function SectionBadge({ section }: { section: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    "Hot Deals":    { bg: "#FF5722", color: "#fff" },
    "Fresh Needs":  { bg: "#00B894", color: "#fff" },
    "Best Sellers": { bg: "#6C63FF", color: "#fff" },
    "New Arrivals": { bg: "#F5A623", color: "#fff" },
  };
  const style = colors[section] || { bg: "#ccc", color: "#fff" };
  return (
    <span style={{
      background: style.bg, color: style.color,
      borderRadius: 20, padding: "3px 10px",
      fontSize: 11, fontWeight: 600, whiteSpace: "nowrap",
    }}>
      {section}
    </span>
  );
}

// ─── Product Image ────────────────────────────────────────────────────────────
function ProductImg({ src, size = 40 }: { src: string; size?: number }) {
  const [error, setError] = useState(false);
  if (!src || error) {
    return (
      <div style={{
        width: size, height: size, borderRadius: 6,
        background: "#F0F0EA", display: "flex",
        alignItems: "center", justifyContent: "center",
        fontSize: size * 0.45, color: "#ccc",
      }}>📦</div>
    );
  }
  return (
    <img src={src} alt="product" onError={() => setError(true)}
      style={{ width: size, height: size, objectFit: "cover", borderRadius: 6, display: "block" }} />
  );
}

// ─── Truncated Text ───────────────────────────────────────────────────────────
function TruncCell({ text, max = 24 }: { text: string; max?: number }) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return <span style={{ color: "#ccc" }}>–</span>;
  if (text.length <= max) return <span>{text}</span>;
  return (
    <span>
      {expanded ? text : `${text.slice(0, max)}…`}{" "}
      <span
        onClick={() => setExpanded((v) => !v)}
        style={{ color: "#6C63FF", cursor: "pointer", fontSize: 11, whiteSpace: "nowrap" }}
      >
        {expanded ? "less" : "more"}
      </span>
    </span>
  );
}

// ─── Mobile Product Card ──────────────────────────────────────────────────────
function ProductCard({ product, idx, onDelete }: {
  product: Product;
  idx: number;
  onDelete: (id: number) => void;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="product-card">
      <div className="product-card-top">
        {/* Image */}
        <div className="product-card-img">
          {product.image && !imgError
            ? <img src={product.image} alt={product.name} onError={() => setImgError(true)} />
            : "📦"
          }
        </div>

        {/* Info */}
        <div className="product-card-info">
          <p className="product-card-name">{product.name}</p>
          <p className="product-card-cat">
            {getName(product.category)}
            {getName(product.subcategory) !== "–" && (
              <> &rsaquo; {getName(product.subcategory)}</>
            )}
          </p>
          <div className="product-card-price-row">
            <span className="product-card-price">₹{product.price}</span>
            {product.mrp && (
              <span className="product-card-mrp">₹{product.mrp}</span>
            )}
          </div>
        </div>
      </div>

      {/* Meta chips */}
      <div className="product-card-meta">
        <span className="product-card-chip">Qty: {product.qty}</span>
        {product.section && <SectionBadge section={product.section} />}
        {product.tags && (
          <span className="product-card-chip">🏷 {product.tags.slice(0, 20)}{product.tags.length > 20 ? "…" : ""}</span>
        )}
      </div>

      {/* Footer actions */}
      <div className="product-card-footer">
        <button
          onClick={() => onDelete(product.id)}
          style={{
            padding: "6px 16px", background: "#E74C3C",
            color: "#fff", border: "none", borderRadius: 6,
            fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}
        >🗑 Delete</button>
      </div>
    </div>
  ); 
}

// ─── Products Page ────────────────────────────────────────────────────────────
const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dropdownLoading, setDropdownLoading] = useState(true);
  const history = useHistory();

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      getName(p.category).toLowerCase().includes(q) ||
      getName(p.subcategory).toLowerCase().includes(q) ||
      (p.tags?.toLowerCase().includes(q) ?? false)
    );
  });

  const fetchDropdowns = useCallback(async () => {
    setDropdownLoading(true);
    try {
      const [catJson, subJson] = await Promise.all([
        apiGet('/category-list'),
        apiGet('/subcategory-list'),
      ]);
      console.log("Category API:", catJson);
      console.log("Subcategory API:", subJson);
    } catch (err) {
      console.error("Failed to load dropdowns:", err);
    } finally {
      setDropdownLoading(false);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const json = await apiGet(`/vendor`);
      if (!json.success) throw new Error(json.message || "API Error");
      setProducts(json.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDropdowns();
    fetchProducts(); 
  }, [fetchDropdowns, fetchProducts]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      const res = await apiDelete(`/vendor/delete/${id}`);
      if (!res.success) throw new Error(res.message || "Delete failed");
      toast.success(res.message || "Product deleted successfully");
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error deleting product";
      toast.error(message);
    }
  };

  const headers = [
    "#", "Image", "Gallery", "Product name", "Category",
    "Subcategory", "Price", "MRP", "Qty", "Section",
    "Tags", "Details", "Description", "Actions",
  ];

  // ── Shared empty/loading states ────────────────────────────────────────────
  const renderLoading = (colSpan: number) => (
    <tr>
      <td colSpan={colSpan} style={{ padding: 40, textAlign: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 30, height: 30,
            border: "3px solid #ddd", borderTop: "3px solid #6C63FF",
            borderRadius: "50%", animation: "spin 1s linear infinite",
          }} />
          <p style={{ margin: 0, fontSize: 13, color: "#888" }}>Loading products…</p>
        </div>
      </td>
    </tr>
  );

  return (
    <Layout title="Products" activeNav="Products">
      <style>{responsiveStyles}</style>

      {/* Breadcrumb */}
      <p style={{ margin: "0 0 18px", fontSize: 13, color: "#999" }}>
        Home &gt;{" "}
        <span style={{ color: "#1a1a1a", fontWeight: 500 }}>Products</span>
      </p>

      {/* Page Header */}
      <div className="products-header">
        <div className="products-header-title">
          <span style={{ fontSize: 22 }}>📦</span>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#1a1a1a" }}>
            Product listing
          </h2>
          {!loading && (
            <span style={{
              background: "#F0F0EA", color: "#666",
              borderRadius: 20, padding: "2px 10px",
              fontSize: 12, fontWeight: 600,
            }}>
              {filtered.length}
            </span>
          )}
        </div>

        <div className="products-header-actions">
          <div className="products-search-box">
            <span style={{ color: "#aaa", fontSize: 14 }}>🔍</span>
            <input
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button
            onClick={() => history.push("/product-add")}
            disabled={dropdownLoading}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 20px",
              background: dropdownLoading ? "#a8d5c8" : "#00B894",
              color: "#fff", border: "none", borderRadius: 8,
              fontSize: 14, fontWeight: 600,
              cursor: dropdownLoading ? "not-allowed" : "pointer",
            }}
          >
            ⊕ Add product
          </button>

          <button
            onClick={fetchProducts}
            title="Refresh"
            style={{
              padding: "10px 12px", background: "#F5F5F0",
              border: "1px solid #E0E0DA", borderRadius: 8,
              fontSize: 16, cursor: "pointer", flexShrink: 0,
            }}
          >🔄</button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div style={{
          background: "#FFF3F3", border: "1px solid #F5C6CB",
          borderRadius: 8, padding: "12px 16px", marginBottom: 16,
          color: "#C0392B", fontSize: 13,
        }}>
          ⚠️ {error} —{" "}
          <span
            style={{ textDecoration: "underline", cursor: "pointer" }}
            onClick={fetchProducts}
          >Retry</span>
        </div>
      )}

      {/* ── DESKTOP: Table ── */}
      <div className="products-desktop-table" style={{
        background: "#fff", borderRadius: 12,
        border: "1px solid #E8E8E4", overflow: "hidden",
      }}>
        <div className="products-table-wrap">
          <table>
            <thead>
              <tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? renderLoading(headers.length)
                : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={headers.length}
                      style={{ padding: 40, textAlign: "center", color: "#aaa", fontSize: 14 }}>
                      {search ? `No products match "${search}"` : "No products found. Click ⊕ Add product to get started."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((product, idx) => (
                    <tr key={product.id} style={{ background: idx % 2 === 0 ? "#fff" : "#FAFAF8" }}>
                      <td style={{ color: "#888" }}>{idx + 1}</td>
                      <td><ProductImg src={product.image} /></td>
                      <td><ProductImg src={product.galleryImages?.[0] || ""} /></td>
                      <td style={{ fontWeight: 500, color: "#1a1a1a" }}>{product.name}</td>
                      <td>{getName(product.category)}</td>
                      <td>{getName(product.subcategory)}</td>
                      <td style={{ color: "#00B894", fontWeight: 600 }}>₹{product.price}</td>
                      <td>{product.mrp ? `₹${product.mrp}` : "–"}</td>
                      <td>{product.qty}</td>
                      <td><SectionBadge section={product.section} /></td>
                      <td><TruncCell text={product.tags} max={16} /></td>
                      <td style={{ maxWidth: 130 }}><TruncCell text={product.details} max={22} /></td>
                      <td style={{ maxWidth: 150 }}><TruncCell text={product.description} max={28} /></td>
                      <td>
                        <button
                          onClick={() => handleDelete(product.id)}
                          style={{
                            padding: "5px 14px", background: "#E74C3C",
                            color: "#fff", border: "none", borderRadius: 6,
                            fontSize: 12, fontWeight: 600, cursor: "pointer",
                          }}
                        >Delete</button>
                      </td>
                    </tr>
                  ))
                )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MOBILE: Cards ── */}
      <div className="product-cards-grid">
        {loading ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <div style={{
              width: 30, height: 30, margin: "0 auto 10px",
              border: "3px solid #ddd", borderTop: "3px solid #6C63FF",
              borderRadius: "50%", animation: "spin 1s linear infinite",
            }} />
            <p style={{ margin: 0, fontSize: 13, color: "#888" }}>Loading products…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#aaa", fontSize: 14 }}>
            {search ? `No products match "${search}"` : "No products found. Click ⊕ Add product to get started."}
          </div>
        ) : (
          filtered.map((product, idx) => (
            <ProductCard
              key={product.id}
              product={product}
              idx={idx}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

    </Layout>
  );
};

export default ProductsPage;